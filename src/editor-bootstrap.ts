import { supabase } from './lib/supabase'

type ProjectRow = {
  id: string
  title: string
  content: Record<string, unknown> | null
}

const artboard =
  document.getElementById('artboard') as HTMLElement | null

const titleInput =
  document.getElementById('docTitle') as HTMLInputElement | null

const saveState =
  document.getElementById('saveState') as HTMLElement | null

const SAVE_DEBOUNCE_MS = 700
const RETRY_INITIAL_MS = 2_000
const RETRY_MAX_MS = 30_000

const DOCUMENT_CHANGED_EVENT =
  'bioplot:document-changed'

function setSaveLabel(text: string) {
  if (saveState) {
    saveState.textContent = text
  }
}

function isPersian() {
  return (
    document.documentElement.dir === 'rtl' ||
    document.documentElement.lang === 'fa'
  )
}

function labels() {
  return isPersian()
    ? {
        connecting:
          'در حال اتصال به فضای ابری…',

        enabled:
          'ذخیره‌سازی ابری فعال است',

        dirty:
          'تغییرات ذخیره‌نشده',

        saving:
          'در حال ذخیره ابری…',

        saved:
          'در فضای ابری ذخیره شد',

        failed:
          'ذخیره ابری ناموفق بود؛ دوباره تلاش می‌شود',

        offline:
          'آفلاین — تغییرات هنوز ذخیره نشده‌اند',

        openFailed:
          'باز کردن پروژه ممکن نشد',
      }
    : {
        connecting:
          'Connecting to BioPlot Cloud…',

        enabled:
          'Cloud autosave enabled',

        dirty:
          'Unsaved changes',

        saving:
          'Saving to cloud…',

        saved:
          'Saved to cloud',

        failed:
          'Cloud save failed — retrying',

        offline:
          'Offline — changes are not yet saved to cloud',

        openFailed:
          'Could not open project',
      }
}

function snapshotCanvas() {
  if (!artboard) {
    return ''
  }

  const clone =
    artboard.cloneNode(true) as HTMLElement

  clone
    .querySelectorAll('.is-selected')
    .forEach((node) => {
      node.classList.remove('is-selected')
    })

  clone
    .querySelectorAll('[contenteditable]')
    .forEach((node) => {
      node.removeAttribute('contenteditable')
    })

  clone
    .querySelector('#selectionBox')
    ?.classList.add('hidden')

  clone
    .querySelector('#guideV')
    ?.classList.add('hidden')

  clone
    .querySelector('#guideH')
    ?.classList.add('hidden')

  return clone.innerHTML
}

let legacyEditorPromise:
  Promise<void> | null = null

function loadLegacyEditor() {
  if (legacyEditorPromise) {
    return legacyEditorPromise
  }

  legacyEditorPromise =
    new Promise<void>((resolve, reject) => {
      const existing =
        document.querySelector<HTMLScriptElement>(
          'script[data-bioplot-legacy-editor]',
        )

      if (existing) {
        if (
          existing.dataset.loaded === 'true'
        ) {
          resolve()
          return
        }

        existing.addEventListener(
          'load',
          () => resolve(),
          { once: true },
        )

        existing.addEventListener(
          'error',
          () => {
            reject(
              new Error(
                'Could not load the BioPlot editor engine.',
              ),
            )
          },
          { once: true },
        )

        return
      }

      const script =
        document.createElement('script')

      script.src = '/app.js'
      script.async = false

      script.dataset.bioplotLegacyEditor =
        'true'

      script.onload = () => {
        script.dataset.loaded = 'true'
        resolve()
      }

      script.onerror = () => {
        reject(
          new Error(
            'Could not load the BioPlot editor engine.',
          ),
        )
      }

      document.body.appendChild(script)
    })

  return legacyEditorPromise
}

async function ensureProject(
  userId: string,
): Promise<string> {
  const params =
    new URLSearchParams(
      window.location.search,
    )

  const existingProjectId =
    params.get('project')

  if (existingProjectId) {
    return existingProjectId
  }

  const { data, error } =
    await supabase
      .from('projects')
      .insert({
        owner_id: userId,

        title:
          'Untitled scientific figure',

        project_type: 'figure',

        content: {
          version: 1,
          editor: 'v2',
        },
      })
      .select('id')
      .single()

  if (error) {
    throw error
  }

  const projectId =
    data.id as string

  const url =
    new URL(window.location.href)

  url.searchParams.set(
    'project',
    projectId,
  )

  window.history.replaceState(
    {},
    '',
    url,
  )

  return projectId
}

async function getProject(
  projectId: string,
) {
  const { data, error } =
    await supabase
      .from('projects')
      .select(
        'id,title,content',
      )
      .eq('id', projectId)
      .single()

  if (error) {
    throw error
  }

  return data as ProjectRow
}

async function start() {
  try {
    setSaveLabel(
      labels().connecting,
    )

    const {
      data: sessionData,
      error: sessionError,
    } =
      await supabase.auth.getSession()

    if (sessionError) {
      throw sessionError
    }

    const session =
      sessionData.session

    if (!session) {
      window.location.replace('/')
      return
    }

    const projectId =
      await ensureProject(
        session.user.id,
      )

    const project =
      await getProject(projectId)

    let projectContent:
      Record<string, unknown> = {
        ...(project.content ?? {}),
      }

    if (titleInput) {
      titleInput.value =
        project.title
    }

    const canvasHtml =
      typeof projectContent.canvas_html ===
      'string'
        ? projectContent.canvas_html
        : null

    if (
      canvasHtml &&
      artboard
    ) {
      artboard.innerHTML =
        canvasHtml
    }

    await loadLegacyEditor()

    let requestedRevision = 0
    let savedRevision = 0

    let saving = false

    let debounceTimer:
      number | undefined

    let retryTimer:
      number | undefined

    let retryDelay =
      RETRY_INITIAL_MS

    const hasPendingChanges = () =>
      saving ||
      savedRevision <
        requestedRevision

    const clearDebounce = () => {
      window.clearTimeout(
        debounceTimer,
      )

      debounceTimer = undefined
    }

    const clearRetry = () => {
      window.clearTimeout(
        retryTimer,
      )

      retryTimer = undefined
    }

    const scheduleRetry = () => {
      if (!navigator.onLine) {
        return
      }

      if (
        retryTimer !== undefined
      ) {
        return
      }

      const delay =
        retryDelay

      retryDelay =
        Math.min(
          retryDelay * 2,
          RETRY_MAX_MS,
        )

      retryTimer =
        window.setTimeout(() => {
          retryTimer = undefined

          void flushSaveQueue()
        }, delay)
    }

    const saveRevision =
      async (
        revision: number,
      ) => {
        projectContent = {
          ...projectContent,

          version: 1,
          editor: 'v2',

          canvas_html:
            snapshotCanvas(),
        }

        const { error } =
          await supabase
            .from('projects')
            .update({
              title:
                titleInput
                  ?.value
                  .trim() ||
                'Untitled scientific figure',

              content:
                projectContent,
            })
            .eq(
              'id',
              projectId,
            )

        if (error) {
          throw error
        }

        savedRevision =
          revision
      }

    async function flushSaveQueue() {
      clearDebounce()

      if (saving) {
        return
      }

      if (
        savedRevision >=
        requestedRevision
      ) {
        return
      }

      if (!navigator.onLine) {
        setSaveLabel(
          labels().offline,
        )

        return
      }

      saving = true

      clearRetry()

      try {
        /*
         * If another edit happens while
         * Supabase is saving, the requested
         * revision becomes higher.
         *
         * The loop then immediately saves
         * the newest revision.
         */
        while (
          savedRevision <
          requestedRevision
        ) {
          const revisionToSave =
            requestedRevision

          setSaveLabel(
            labels().saving,
          )

          await saveRevision(
            revisionToSave,
          )
        }

        retryDelay =
          RETRY_INITIAL_MS

        setSaveLabel(
          labels().saved,
        )
      } catch (error) {
        console.error(
          'BioPlot cloud save failed:',
          error,
        )

        setSaveLabel(
          labels().failed,
        )

        scheduleRetry()
      } finally {
        saving = false
      }
    }

    const scheduleSave = (
      delay =
        SAVE_DEBOUNCE_MS,
    ) => {
      clearDebounce()

      debounceTimer =
        window.setTimeout(
          () => {
            void flushSaveQueue()
          },
          delay,
        )
    }

    const markDocumentChanged =
      () => {
        requestedRevision += 1

        setSaveLabel(
          navigator.onLine
            ? labels().dirty
            : labels().offline,
        )

        scheduleSave()
      }

    window.addEventListener(
      DOCUMENT_CHANGED_EVENT,
      markDocumentChanged,
    )

    window.addEventListener(
      'online',
      () => {
        if (
          savedRevision <
          requestedRevision
        ) {
          scheduleSave(0)
          return
        }

        setSaveLabel(
          labels().enabled,
        )
      },
    )

    window.addEventListener(
      'offline',
      () => {
        if (
          hasPendingChanges()
        ) {
          setSaveLabel(
            labels().offline,
          )
        }
      },
    )

    document.addEventListener(
      'visibilitychange',
      () => {
        if (
          document.visibilityState ===
            'hidden' &&
          savedRevision <
            requestedRevision
        ) {
          void flushSaveQueue()
        }
      },
    )

    window.addEventListener(
      'beforeunload',
      (event) => {
        if (
          !hasPendingChanges()
        ) {
          return
        }

        event.preventDefault()
        event.returnValue = ''
      },
    )

    setSaveLabel(
      labels().enabled,
    )
  } catch (error) {
    console.error(
      'BioPlot project bootstrap failed:',
      error,
    )

    setSaveLabel(
      labels().openFailed,
    )
  }
}

void start()
