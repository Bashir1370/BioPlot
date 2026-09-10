import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'

type Lang = 'en' | 'fa'
type ProjectType = 'figure' | 'plot' | 'graphical_abstract' | 'pathway' | 'network'
type Project = {
  id: string
  title: string
  project_type: ProjectType
  updated_at: string
}

const copy = {
  en: {
    eyebrow: 'SCIENTIFIC VISUALIZATION WORKSPACE',
    headline: 'What will you create today?',
    subhead: 'Turn biological ideas, data and mechanisms into clear, publication-ready visuals.',
    search: 'Search your projects…',
    recent: 'Recent projects',
    newProject: 'New project',
    empty: 'No projects yet. Create your first scientific visual.',
    signOut: 'Sign out',
    loginTitle: 'Welcome to BioPlot',
    loginSub: 'Sign in to continue your scientific visualization workspace.',
    signupTitle: 'Create your BioPlot account',
    signupSub: 'Save projects, return later and build your scientific visual library.',
    name: 'Name', email: 'Email', password: 'Password', signIn: 'Sign in', signUp: 'Create account',
    haveAccount: 'Already have an account?', noAccount: 'New to BioPlot?',
  },
  fa: {
    eyebrow: 'فضای کاری تصویرسازی علمی',
    headline: 'امروز چه چیزی می‌سازی؟',
    subhead: 'ایده‌ها، داده‌ها و مکانیسم‌های زیستی را به تصاویر علمی آماده انتشار تبدیل کن.',
    search: 'جست‌وجو در پروژه‌ها…',
    recent: 'پروژه‌های اخیر',
    newProject: 'پروژه جدید',
    empty: 'هنوز پروژه‌ای نداری. اولین تصویر علمی خودت را بساز.',
    signOut: 'خروج',
    loginTitle: 'به BioPlot خوش آمدی',
    loginSub: 'برای ادامه وارد فضای کاری تصویرسازی علمی خودت شو.',
    signupTitle: 'حساب BioPlot بساز',
    signupSub: 'پروژه‌ها را ذخیره کن و هر زمان خواستی ادامه بده.',
    name: 'نام', email: 'ایمیل', password: 'رمز عبور', signIn: 'ورود', signUp: 'ساخت حساب',
    haveAccount: 'از قبل حساب داری؟', noAccount: 'تازه وارد BioPlot شدی؟',
  },
}

const creationCards: { type: ProjectType; title: string; desc: string; badge: string; icon: string }[] = [
  { type: 'figure', title: 'Scientific Figure', desc: 'Mechanisms, workflows and biological illustrations.', badge: 'AVAILABLE', icon: '◉—' },
  { type: 'plot', title: 'Plot & Chart', desc: 'Publication-style plots in the same workspace.', badge: 'PREVIEW', icon: '▂▆▄█' },
  { type: 'graphical_abstract', title: 'Graphical Abstract', desc: 'Visual summaries for manuscripts and presentations.', badge: 'AVAILABLE', icon: 'A  •  ▬' },
  { type: 'pathway', title: 'Pathway', desc: 'Structured signaling and molecular pathway diagrams.', badge: 'SOON', icon: '●—●' },
  { type: 'network', title: 'Network', desc: 'Gene, protein and systems-biology networks.', badge: 'SOON', icon: '⌯' },
]

function Brand({ compact = false }: { compact?: boolean }) {
  return <div className="brand"><span className="brandMark">B·</span>{!compact && <b>BioPlot</b>}</div>
}

function AuthScreen({ lang, setLang }: { lang: Lang; setLang: (lang: Lang) => void }) {
  const t = copy[lang]
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: name.trim() || email.split('@')[0] } },
        })
        if (error) throw error
        if (!data.session) setMessage(lang === 'fa' ? 'ایمیل تأیید را بررسی کن.' : 'Check your email to confirm your account.')
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return <main className={`authPage ${lang === 'fa' ? 'rtl' : ''}`} dir={lang === 'fa' ? 'rtl' : 'ltr'}>
    <header className="authTop"><Brand /><button className="langBtn" onClick={() => setLang(lang === 'en' ? 'fa' : 'en')}>{lang === 'en' ? 'FA' : 'EN'}</button></header>
    <section className="authLayout">
      <div className="authStory">
        <span className="eyebrow">BIOPLOT</span>
        <h1>{mode === 'signin' ? t.loginTitle : t.signupTitle}</h1>
        <p>{mode === 'signin' ? t.loginSub : t.signupSub}</p>
        <div className="authVisual"><div className="node n1">DNA</div><div className="line l1"/><div className="node n2">ROS</div><div className="line l2"/><div className="node n3">TRPV1</div><div className="miniPlot"><i/><i/><i/><i/></div></div>
      </div>
      <form className="authCard" onSubmit={submit}>
        <div><span className="eyebrow">{mode === 'signin' ? 'SIGN IN' : 'CREATE ACCOUNT'}</span><h2>{mode === 'signin' ? t.signIn : t.signUp}</h2></div>
        {mode === 'signup' && <label>{t.name}<input value={name} onChange={e => setName(e.target.value)} autoComplete="name" /></label>}
        <label>{t.email}<input type="email" required value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" /></label>
        <label>{t.password}<input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} /></label>
        {message && <div className="authMessage">{message}</div>}
        <button className="primary full" disabled={busy}>{busy ? '…' : mode === 'signin' ? t.signIn : t.signUp}</button>
        <button type="button" className="switchMode" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMessage('') }}>
          {mode === 'signin' ? `${t.noAccount} ${t.signUp}` : `${t.haveAccount} ${t.signIn}`}
        </button>
      </form>
    </section>
  </main>
}

function Dashboard({ session, lang, setLang }: { session: Session; lang: Lang; setLang: (lang: Lang) => void }) {
  const t = copy[lang]
  const [projects, setProjects] = useState<Project[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState<ProjectType | null>(null)
  const [error, setError] = useState('')

  async function loadProjects() {
    setLoading(true)
    const { data, error } = await supabase
      .from('projects')
      .select('id,title,project_type,updated_at')
      .eq('is_archived', false)
      .order('updated_at', { ascending: false })
    if (error) setError(error.message)
    else setProjects((data ?? []) as Project[])
    setLoading(false)
  }

  useEffect(() => { void loadProjects() }, [])

  const filtered = useMemo(() => projects.filter(p => p.title.toLowerCase().includes(search.toLowerCase())), [projects, search])

  async function createProject(type: ProjectType) {
    if (type === 'pathway' || type === 'network') return
    setCreating(type)
    setError('')
    const defaultTitle = type === 'plot' ? 'Untitled plot' : type === 'graphical_abstract' ? 'Untitled graphical abstract' : 'Untitled scientific figure'
    const { data, error } = await supabase.from('projects').insert({
      owner_id: session.user.id,
      title: defaultTitle,
      project_type: type,
      content: { version: 1, objects: [] },
    }).select('id').single()
    setCreating(null)
    if (error) { setError(error.message); return }
    window.location.href = `/editor.html?project=${data.id}`
  }

  return <div className={`app ${lang === 'fa' ? 'rtl' : ''}`} dir={lang === 'fa' ? 'rtl' : 'ltr'}>
    <aside className="sidebar">
      <Brand />
      <nav>
        <button className="nav active">⌂ <span>Home</span></button>
        <button className="nav">▣ <span>Projects</span></button>
        <button className="nav">▦ <span>Templates</span></button>
        <a className="nav" href="/editor.html">✦ <span>Editor</span></a>
        <button className="nav">◫ <span>Library</span></button>
      </nav>
      <div className="betaCard"><span>BIOPLOT BETA</span><b>Built for scientific thinking</b><p>Figures today. Plots, pathways and networks next.</p></div>
    </aside>

    <section className="mainArea">
      <header className="topbar">
        <div className="search"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.search} /></div>
        <div className="topActions">
          <button className="langBtn" onClick={() => setLang(lang === 'en' ? 'fa' : 'en')}>{lang === 'en' ? 'FA' : 'EN'}</button>
          <div className="userBubble">{(session.user.email?.[0] ?? 'B').toUpperCase()}</div>
          <div className="userMeta"><b>{session.user.user_metadata?.display_name || session.user.email?.split('@')[0]}</b><span>{session.user.email}</span></div>
          <button className="signout" onClick={() => supabase.auth.signOut()}>{t.signOut}</button>
        </div>
      </header>

      <div className="content">
        <div className="heroRow"><div><span className="eyebrow">{t.eyebrow}</span><h1>{t.headline}</h1><p>{t.subhead}</p></div><button className="primary" onClick={() => createProject('figure')}>＋ {t.newProject}</button></div>
        <div className="createGrid">
          {creationCards.map(card => <button key={card.type} className={`createCard ${card.type === 'figure' ? 'featured' : ''} ${(card.type === 'pathway' || card.type === 'network') ? 'disabled' : ''}`} onClick={() => createProject(card.type)} disabled={creating !== null || card.type === 'pathway' || card.type === 'network'}>
            <div className={`cardVisual ${card.type}`}><span>{card.icon}</span></div>
            <span className={`badge ${card.badge.toLowerCase()}`}>{creating === card.type ? 'CREATING…' : card.badge}</span>
            <h3>{card.title}</h3><p>{card.desc}</p><i>→</i>
          </button>)}
        </div>

        <div className="sectionHead"><div><span className="eyebrow">YOUR WORK</span><h2>{t.recent}</h2></div><span>{projects.length} projects</span></div>
        {error && <div className="errorBox">{error}</div>}
        <div className="projectGrid">
          {loading ? <div className="emptyState">Loading projects…</div> : filtered.length === 0 ? <button className="emptyState newEmpty" onClick={() => createProject('figure')}>＋<b>{t.empty}</b></button> : filtered.map(project => <button className="projectCard" key={project.id} onClick={() => { window.location.href = `/editor.html?project=${project.id}` }}>
            <div className={`projectPreview ${project.project_type}`}><span>{project.project_type === 'plot' ? '▂ ▆ ▃ █' : '●  →  ◉  →  ▣'}</span></div>
            <div className="projectInfo"><div><b>{project.title}</b><span>{project.project_type.replace('_', ' ')}</span></div><time>{new Date(project.updated_at).toLocaleDateString(lang === 'fa' ? 'fa-IR' : 'en-US')}</time></div>
          </button>)}
        </div>
      </div>
    </section>
  </div>
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem('bioplot-lang') === 'fa' ? 'fa' : 'en'))

  function setLang(next: Lang) { localStorage.setItem('bioplot-lang', next); setLangState(next) }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false) })
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession))
    return () => data.subscription.unsubscribe()
  }, [])

  if (loading) return <div className="splash"><Brand /><span>Preparing your scientific workspace…</span></div>
  return session ? <Dashboard session={session} lang={lang} setLang={setLang} /> : <AuthScreen lang={lang} setLang={setLang} />
}
