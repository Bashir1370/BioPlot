import { supabase } from './lib/supabase'

type ProjectRow = {
  id: string
  title: string
  content: Record<string, unknown> | null
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

function snapshotCanvas() {
  if (!artboard) return ''
  const clone = artboard.cloneNode(true) as HTMLElement
  clone.querySelectorAll('.is-selected').forEach((node) => node.classList.remove('is-selected'))
  clone.querySelectorAll('[contenteditable]').forEach((node) => node.removeAttribute('contenteditable'))
  const selection = clone.querySelector('#selectionBox')
  selection?.classList.add('hidden')
  clone.querySelector('#guideV')?.classList.add('hidden')
  clone.querySelector('#guideH')?.classList.add('hidden')
  return clone.innerHTML
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
    .select('id,title,content')
    .eq('id', projectId)
    .single()

  if (error) throw error
  return data as ProjectRow
}

async function start() {
  try {
    setSaveLabel('Connecting to BioPlot Cloud…')
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) throw sessionError
    const session = sessionData.session
    if (!session) {
      window.location.replace('/')
      return
    }

    const projectId = await ensureProject(session.user.id)
    const project = await getProject(projectId)

    if (titleInput) titleInput.value = project.title
    const canvasHtml = project.content && typeof project.content.canvas_html === 'string'
      ? project.content.canvas_html
      : null
    if (canvasHtml && artboard) artboard.innerHTML = canvasHtml

    await loadLegacyEditor()

    let timer: number | undefined
    let saving = false

    const saveProject = async () => {
      if (saving) return
      saving = true
      setSaveLabel(isPersian() ? 'در حال ذخیره ابری…' : 'Saving to cloud…')
      const { error } = await supabase
        .from('projects')
        .update({
          title: titleInput?.value.trim() || 'Untitled scientific figure',
          content: {
            version: 1,
            editor: 'v2',
            canvas_html: snapshotCanvas(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId)

      saving = false
      if (error) {
        console.error(error)
        setSaveLabel(isPersian() ? 'خطا در ذخیره ابری' : 'Cloud save failed')
        return
      }
      setSaveLabel(isPersian() ? 'ذخیره شد در فضای ابری' : 'Saved to cloud')
    }

    const scheduleSave = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => void saveProject(), 700)
    }

    if (saveState) {
      const observer = new MutationObserver(() => {
        const text = saveState.textContent || ''
        if (text === 'Saved locally' || text === 'ذخیره شد') scheduleSave()
      })
      observer.observe(saveState, { childList: true, subtree: true, characterData: true })
    }

    titleInput?.addEventListener('change', scheduleSave)
    window.addEventListener('beforeunload', () => {
      window.clearTimeout(timer)
    })

    setSaveLabel(isPersian() ? 'ذخیره ابری فعال است' : 'Cloud autosave enabled')
  } catch (error) {
    console.error(error)
    setSaveLabel(isPersian() ? 'خطا در اتصال به پروژه' : 'Could not open project')
  }
}

void start()
