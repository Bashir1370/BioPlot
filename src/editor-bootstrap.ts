import { isSupabaseConfigured, supabase } from './lib/supabase'

type ProjectRow = {
  id: string
  title: string
  content: Record<string, unknown> | null
  updated_at: string
}

type RecoverySnapshot = {
  title: string
  canvas_html: string
  saved_at: string
}

const artboard = document.getElementById('artboard') as HTMLElement | null
const titleInput = document.getElementById('docTitle') as HTMLInputElement | null
const saveState = document.getElementById('saveState') as HTMLElement | null

function setSaveLabel(text: string) {
  if (saveState) saveState.textContent = text
}

function isPersian() {
  return document.documentElement.dir === 'rtl' || document.documentElement.lang === 'fa'
}

function applyStoredLanguage() {
  const lang = localStorage.getItem('bioplot-lang') === 'fa' ? 'fa' : 'en'
  document.documentElement.lang = lang
  document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr'
  document.body.classList.toggle('rtl', lang === 'fa')
}

function snapshotCanvas() {
  if (!artboard) return ''
  const clone = artboard.cloneNode(true) as HTMLElement
  clone.querySelectorAll('.is-selected').forEach((node) => node.classList.remove('is-selected'))
  clone.querySelectorAll('[contenteditable]').forEach((node) => node.removeAttribute('contenteditable'))
  clone.querySelector('#selectionBox')?.classList.add('hidden')
  clone.querySelector('#guideV')?.classList.add('hidden')
  clone.querySelector('#guideH')?.classList.add('hidden')
  return clone.innerHTML
}

function sanitizeCanvasHtml(html: string) {
  const template = document.createElement('template')
  template.innerHTML = html

  template.content
    .querySelectorAll('script,iframe,object,embed,foreignObject')
    .forEach((node) => node.remove())

  template.content.querySelectorAll('*').forEach((node) => {
    for (const attribute of Array.from(node.attributes)) {
      const name = attribute.name.toLowerCase()
      const value = attribute.value.trim().toLowerCase()
      if (
        name.startsWith('on') ||
        name === 'srcdoc' ||
        ((name === 'href' || name.endsWith(':href')) && value.startsWith('javascript:'))
      ) {
        node.removeAttribute(attribute.name)
      }
    }
  })

  return template.innerHTML
}

async function loadLegacyEditor() {
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = '/app.js'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Could not load the BioPlot editor engine.'))
    document.body.appendChild(script)
  })
}

async function ensureProject(userId: string) {
  const params = new URLSearchParams(window.location.search)
  let projectId = params.get('project')
  if (projectId) return projectId

  const { data, error } = await supabase
    .from('projects')
    .insert({
      owner_id: userId,
      title: 'Untitled scientific figure',
      project_type: 'figure',
      content: { version: 1, editor: 'v2' },
    })
    .select('id')
    .single()

  if (error) throw error
  projectId = data.id

  const url = new URL(window.location.href)
  url.searchParams.set('project', projectId)
  window.history.replaceState({}, '', url)
  return projectId
}

async function getProject(projectId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('id,title,content,updated_at')
    .eq('id', projectId)
    .single()

  if (error) throw error
  return data as ProjectRow
}

function readRecovery(key: string): RecoverySnapshot | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<RecoverySnapshot>
    if (typeof parsed.canvas_html !== 'string' || typeof parsed.saved_at !== 'string') return null
    return {
      title: typeof parsed.title === 'string' ? parsed.title : 'Untitled scientific figure',
      canvas_html: parsed.canvas_html,
      saved_at: parsed.saved_at,
    }
  } catch {
    return null
  }
}

async function start() {
  applyStoredLanguage()

  if (!isSupabaseConfigured) {
    setSaveLabel(isPersian() ? 'تنظیمات Supabase ناقص است' : 'Supabase is not configured')
    return
  }

  try {
    setSaveLabel(isPersian() ? 'در حال اتصال به BioPlot Cloud…' : 'Connecting to BioPlot Cloud…')

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) throw sessionError

    const session = sessionData.session
    if (!session) {
      window.location.replace('/')
      return
    }

    const projectId = await ensureProject(session.user.id)
    const project = await getProject(projectId)
    const recoveryKey = `bioplot:recovery:${projectId}`
    const recovery = readRecovery(recoveryKey)

    const cloudHtml = project.content && typeof project.content.canvas_html === 'string'
      ? project.content.canvas_html
      : null

    const recoveryIsNewer = recovery
      ? Date.parse(recovery.saved_at) > Date.parse(project.updated_at)
      : false

    if (titleInput) titleInput.value = recoveryIsNewer && recovery ? recovery.title : project.title

    const initialHtml = recoveryIsNewer && recovery ? recovery.canvas_html : cloudHtml
    if (initialHtml && artboard) artboard.innerHTML = sanitizeCanvasHtml(initialHtml)

    await loadLegacyEditor()

    let timer: number | undefined
    let saving = false
    let dirty = recoveryIsNewer
    let stopped = false

    const writeRecovery = () => {
      try {
        const snapshot: RecoverySnapshot = {
          title: titleInput?.value.trim() || 'Untitled scientific figure',
          canvas_html: snapshotCanvas(),
          saved_at: new Date().toISOString(),
        }
        localStorage.setItem(recoveryKey, JSON.stringify(snapshot))
      } catch (error) {
        console.warn('Could not write BioPlot recovery snapshot', error)
      }
    }

    const saveProject = async () => {
      if (saving || !dirty || stopped) return
      saving = true

      while (dirty && !stopped) {
        dirty = false
        setSaveLabel(isPersian() ? 'در حال ذخیره ابری…' : 'Saving to cloud…')

        const payload = {
          title: titleInput?.value.trim() || 'Untitled scientific figure',
          content: {
            version: 1,
            editor: 'v2',
            canvas_html: snapshotCanvas(),
          },
        }

        const { error } = await supabase
          .from('projects')
          .update(payload)
          .eq('id', projectId)

        if (error) {
          console.error(error)
          dirty = true
          writeRecovery()
          setSaveLabel(isPersian() ? 'ذخیره ابری ناموفق؛ نسخه محلی امن است' : 'Cloud save failed; local recovery is safe')
          break
        }

        localStorage.removeItem(recoveryKey)
        setSaveLabel(isPersian() ? 'ذخیره شد در فضای ابری' : 'Saved to cloud')
      }

      saving = false
    }

    const scheduleSave = () => {
      if (stopped) return
      dirty = true
      writeRecovery()
      window.clearTimeout(timer)
      timer = window.setTimeout(() => void saveProject(), 700)
    }

    window.addEventListener('bioplot:document-change', scheduleSave)

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && dirty) {
        window.clearTimeout(timer)
        void saveProject()
      }
    })

    window.addEventListener('pagehide', () => {
      if (dirty) writeRecovery()
    })

    window.addEventListener('beforeunload', () => {
      window.clearTimeout(timer)
      if (dirty) writeRecovery()
      stopped = true
    })

    if (recoveryIsNewer) {
      setSaveLabel(isPersian() ? 'نسخه محلی بازیابی شد؛ در حال همگام‌سازی…' : 'Recovered local changes; syncing…')
      scheduleSave()
    } else {
      setSaveLabel(isPersian() ? 'ذخیره ابری فعال است' : 'Cloud autosave enabled')
    }
  } catch (error) {
    console.error(error)
    setSaveLabel(isPersian() ? 'خطا در اتصال به پروژه' : 'Could not open project')
  }
}

void start()
