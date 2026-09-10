import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from './lib/supabase'

type Lang = 'en' | 'fa'
type AuthMode = 'signin' | 'signup'
type ProjectType = 'figure' | 'plot' | 'graphical_abstract' | 'pathway' | 'network' | 'poster' | 'presentation'

type Project = {
  id: string
  title: string
  project_type: ProjectType
  updated_at: string
}

const copy = {
  en: {
    loading: 'Loading BioPlot…',
    configTitle: 'Supabase is not configured',
    configBody: 'Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to your environment, then reload BioPlot.',
    signIn: 'Sign in',
    signUp: 'Create account',
    email: 'Email',
    password: 'Password',
    displayName: 'Display name',
    noAccount: 'Need an account?',
    hasAccount: 'Already have an account?',
    authIntro: 'Build publication-ready scientific figures, plots and graphical abstracts in one workspace.',
    authTitle: 'Scientific visualization, built for researchers',
    checkEmail: 'Account created. Check your email to confirm the account, then sign in.',
    dashboardTitle: 'Create scientific visuals faster',
    dashboardBody: 'Start a new project or continue one of your recent BioPlot documents.',
    search: 'Search projects…',
    create: 'Create',
    recent: 'Recent projects',
    noProjects: 'No projects yet. Create your first scientific figure.',
    signOut: 'Sign out',
    figure: 'Scientific figure',
    graphicalAbstract: 'Graphical abstract',
    plot: 'Scientific plot',
    pathway: 'Pathway',
    network: 'Network',
    available: 'AVAILABLE',
    preview: 'COMING NEXT',
    figureDesc: 'Compose biological assets, labels and annotations on a publication-ready canvas.',
    graphicalDesc: 'Build a structured visual summary for a paper, thesis or presentation.',
    plotDesc: 'Create editable scientific charts from real data.',
    pathwayDesc: 'Map mechanisms, signaling pathways and experimental workflows.',
    networkDesc: 'Build biological and analytical network diagrams.',
    projectsError: 'Could not load your projects.',
    createError: 'Could not create the project.',
    untitled: 'Untitled scientific figure',
  },
  fa: {
    loading: 'در حال بارگذاری BioPlot…',
    configTitle: 'Supabase تنظیم نشده است',
    configBody: 'متغیرهای VITE_SUPABASE_URL و VITE_SUPABASE_PUBLISHABLE_KEY را به محیط اضافه کنید و BioPlot را دوباره بارگذاری کنید.',
    signIn: 'ورود',
    signUp: 'ساخت حساب',
    email: 'ایمیل',
    password: 'رمز عبور',
    displayName: 'نام نمایشی',
    noAccount: 'حساب ندارید؟',
    hasAccount: 'قبلاً حساب ساخته‌اید؟',
    authIntro: 'شکل‌های علمی، نمودارها و graphical abstractهای آماده انتشار را در یک محیط بسازید.',
    authTitle: 'طراحی علمی برای پژوهشگران',
    checkEmail: 'حساب ساخته شد. ایمیل خود را برای تأیید باز کنید و سپس وارد شوید.',
    dashboardTitle: 'طراحی علمی را سریع‌تر انجام بده',
    dashboardBody: 'یک پروژه جدید بساز یا یکی از پروژه‌های اخیر BioPlot را ادامه بده.',
    search: 'جست‌وجوی پروژه‌ها…',
    create: 'ساخت',
    recent: 'پروژه‌های اخیر',
    noProjects: 'هنوز پروژه‌ای ندارید. اولین شکل علمی خود را بسازید.',
    signOut: 'خروج',
    figure: 'شکل علمی',
    graphicalAbstract: 'Graphical abstract',
    plot: 'نمودار علمی',
    pathway: 'مسیر زیستی',
    network: 'شبکه',
    available: 'فعال',
    preview: 'به‌زودی',
    figureDesc: 'المان‌های زیستی، برچسب‌ها و توضیحات را روی یک بوم مناسب انتشار بچینید.',
    graphicalDesc: 'برای مقاله، پایان‌نامه یا ارائه یک خلاصه تصویری ساختاریافته بسازید.',
    plotDesc: 'از داده واقعی نمودار علمی قابل ویرایش بسازید.',
    pathwayDesc: 'مکانیسم‌ها، مسیرهای پیام‌رسانی و workflowهای آزمایش را ترسیم کنید.',
    networkDesc: 'دیاگرام شبکه‌های زیستی و تحلیلی بسازید.',
    projectsError: 'بارگذاری پروژه‌ها انجام نشد.',
    createError: 'ساخت پروژه انجام نشد.',
    untitled: 'شکل علمی بدون عنوان',
  },
} as const

function useLanguage() {
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem('bioplot-lang') === 'fa' ? 'fa' : 'en'))

  useEffect(() => {
    const isFa = lang === 'fa'
    document.documentElement.lang = lang
    document.documentElement.dir = isFa ? 'rtl' : 'ltr'
    document.body.classList.toggle('rtl', isFa)
    localStorage.setItem('bioplot-lang', lang)
  }, [lang])

  return { lang, setLang, t: copy[lang] }
}

function ConfigScreen({ lang, toggleLanguage }: { lang: Lang; toggleLanguage: () => void }) {
  const t = copy[lang]
  return (
    <main className="authPage">
      <header className="authTop">
        <Brand />
        <button className="langBtn" onClick={toggleLanguage}>{lang === 'fa' ? 'EN' : 'FA'}</button>
      </header>
      <section className="splash">
        <h2>{t.configTitle}</h2>
        <p>{t.configBody}</p>
      </section>
    </main>
  )
}

function Brand() {
  return (
    <div className="brand">
      <div className="brandMark">B</div>
      <div>
        <span className="eyebrow">SCIENTIFIC VISUALIZATION</span>
        <b>BioPlot</b>
      </div>
    </div>
  )
}

function AuthScreen({ lang, toggleLanguage }: { lang: Lang; toggleLanguage: () => void }) {
  const t = copy[lang]
  const [mode, setMode] = useState<AuthMode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')

    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { display_name: displayName.trim() || email.split('@')[0] },
          },
        })
        if (signUpError) throw signUpError
        if (!data.session) {
          setMessage(t.checkEmail)
          setMode('signin')
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (signInError) throw signInError
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Authentication failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="authPage">
      <header className="authTop">
        <Brand />
        <button className="langBtn" onClick={toggleLanguage}>{lang === 'fa' ? 'EN' : 'FA'}</button>
      </header>

      <section className="authLayout">
        <div className="authStory">
          <span className="eyebrow">BIOPLOT CLOUD</span>
          <h1>{t.authTitle}</h1>
          <p>{t.authIntro}</p>
          <div className="authVisual" aria-hidden="true">
            <div className="node n1">DNA</div>
            <div className="node n2">Cell</div>
            <div className="node n3">TRPV1</div>
            <div className="line l1" />
            <div className="line l2" />
            <div className="miniPlot"><i /><i /><i /><i /></div>
          </div>
        </div>

        <form className="authCard" onSubmit={submit}>
          <span className="eyebrow">BIOPLOT ACCOUNT</span>
          <h2>{mode === 'signin' ? t.signIn : t.signUp}</h2>

          {error && <div className="errorBox">{error}</div>}
          {message && <div className="authMessage">{message}</div>}

          {mode === 'signup' && (
            <label>
              {t.displayName}
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} autoComplete="name" />
            </label>
          )}

          <label>
            {t.email}
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </label>

          <label>
            {t.password}
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} />
          </label>

          <button className="primary full" disabled={busy} type="submit">
            {busy ? '…' : mode === 'signin' ? t.signIn : t.signUp}
          </button>

          <button
            className="switchMode"
            type="button"
            onClick={() => {
              setError('')
              setMessage('')
              setMode((current) => current === 'signin' ? 'signup' : 'signin')
            }}
          >
            {mode === 'signin' ? `${t.noAccount} ${t.signUp}` : `${t.hasAccount} ${t.signIn}`}
          </button>
        </form>
      </section>
    </main>
  )
}

function Dashboard({ session, lang, toggleLanguage }: { session: Session; lang: Lang; toggleLanguage: () => void }) {
  const t = copy[lang]
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState<ProjectType | null>(null)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')

  const loadProjects = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data, error: loadError } = await supabase
      .from('projects')
      .select('id,title,project_type,updated_at')
      .eq('owner_id', session.user.id)
      .eq('is_archived', false)
      .order('updated_at', { ascending: false })
      .limit(24)

    if (loadError) {
      console.error(loadError)
      setError(t.projectsError)
      setProjects([])
    } else {
      setProjects((data ?? []) as Project[])
    }
    setLoading(false)
  }, [session.user.id, t.projectsError])

  useEffect(() => {
    void loadProjects()
  }, [loadProjects])

  const visibleProjects = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return projects
    return projects.filter((project) => project.title.toLowerCase().includes(normalized))
  }, [projects, query])

  const createProject = async (projectType: ProjectType) => {
    setCreating(projectType)
    setError('')
    const title = projectType === 'graphical_abstract'
      ? (lang === 'fa' ? 'Graphical abstract بدون عنوان' : 'Untitled graphical abstract')
      : t.untitled

    const { data, error: createError } = await supabase
      .from('projects')
      .insert({
        owner_id: session.user.id,
        title,
        project_type: projectType,
        content: { version: 1, editor: 'v2' },
      })
      .select('id')
      .single()

    if (createError || !data) {
      console.error(createError)
      setError(t.createError)
      setCreating(null)
      return
    }

    window.location.href = `/editor.html?project=${encodeURIComponent(data.id)}`
  }

  const openProject = (projectId: string) => {
    window.location.href = `/editor.html?project=${encodeURIComponent(projectId)}`
  }

  const cards: Array<{ type: ProjectType; title: string; description: string; icon: string; enabled: boolean }> = [
    { type: 'figure', title: t.figure, description: t.figureDesc, icon: '◫', enabled: true },
    { type: 'graphical_abstract', title: t.graphicalAbstract, description: t.graphicalDesc, icon: '✦', enabled: true },
    { type: 'plot', title: t.plot, description: t.plotDesc, icon: '⌁', enabled: false },
    { type: 'pathway', title: t.pathway, description: t.pathwayDesc, icon: '⇢', enabled: false },
    { type: 'network', title: t.network, description: t.networkDesc, icon: '⬡', enabled: false },
  ]

  const displayName = session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || 'BioPlot user'
  const initials = String(displayName).slice(0, 2).toUpperCase()

  return (
    <div className={`app ${lang === 'fa' ? 'rtl' : ''}`}>
      <aside className="sidebar">
        <Brand />
        <nav>
          <button className="nav active"><span>⌂</span><span>{lang === 'fa' ? 'خانه' : 'Home'}</span></button>
          <button className="nav"><span>▦</span><span>{lang === 'fa' ? 'پروژه‌ها' : 'Projects'}</span></button>
          <button className="nav"><span>◫</span><span>{lang === 'fa' ? 'کتابخانه' : 'Library'}</span></button>
        </nav>
        <div className="betaCard">
          <span>BIOPLOT BETA</span>
          <b>{lang === 'fa' ? 'پایه SaaS فعال است' : 'SaaS foundation active'}</b>
          <p>{lang === 'fa' ? 'ذخیره ابری و مدل سند حرفه‌ای را مرحله‌به‌مرحله تکمیل می‌کنیم.' : 'Cloud persistence and the professional document model are being built step by step.'}</p>
        </div>
      </aside>

      <div className="mainArea">
        <header className="topbar">
          <label className="search">
            <span>⌕</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.search} />
          </label>
          <div className="topActions">
            <button className="langBtn" onClick={toggleLanguage}>{lang === 'fa' ? 'EN' : 'FA'}</button>
            <div className="userBubble">{initials}</div>
            <div className="userMeta">
              <b>{displayName}</b>
              <span>{session.user.email}</span>
            </div>
            <button className="signout" onClick={() => void supabase.auth.signOut()}>{t.signOut}</button>
          </div>
        </header>

        <main className="content">
          <div className="heroRow">
            <div>
              <span className="eyebrow">BIOPLOT WORKSPACE</span>
              <h1>{t.dashboardTitle}</h1>
              <p>{t.dashboardBody}</p>
            </div>
          </div>

          {error && <div className="errorBox">{error}</div>}

          <section className="createGrid">
            {cards.map((card) => (
              <button
                key={card.type}
                className={`createCard ${card.type === 'figure' ? 'featured' : ''} ${card.enabled ? '' : 'disabled'}`}
                disabled={!card.enabled || creating !== null}
                onClick={() => card.enabled && void createProject(card.type)}
              >
                <div className={`cardVisual ${card.type}`}>{card.icon}</div>
                <span className={`badge ${card.enabled ? 'available' : 'preview'}`}>{card.enabled ? t.available : t.preview}</span>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
                <i>{creating === card.type ? '…' : '→'}</i>
              </button>
            ))}
          </section>

          <div className="sectionHead">
            <div>
              <span className="eyebrow">BIOPLOT CLOUD</span>
              <h2>{t.recent}</h2>
            </div>
            <span>{visibleProjects.length} {lang === 'fa' ? 'پروژه' : 'projects'}</span>
          </div>

          <section className="projectGrid">
            {loading ? (
              <div className="emptyState">{t.loading}</div>
            ) : visibleProjects.length ? (
              visibleProjects.map((project) => (
                <button className="projectCard" key={project.id} onClick={() => openProject(project.id)}>
                  <div className={`projectPreview ${project.project_type}`}>{project.project_type === 'graphical_abstract' ? 'GA' : 'BP'}</div>
                  <div className="projectInfo">
                    <div>
                      <b>{project.title}</b>
                      <span>{project.project_type.replace('_', ' ')}</span>
                    </div>
                    <time>{new Intl.DateTimeFormat(lang === 'fa' ? 'fa-IR' : 'en', { dateStyle: 'medium' }).format(new Date(project.updated_at))}</time>
                  </div>
                </button>
              ))
            ) : (
              <button className="emptyState newEmpty" onClick={() => void createProject('figure')}>
                <span className="brandMark">+</span>
                <b>{t.noProjects}</b>
              </button>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  const { lang, setLang, t } = useLanguage()
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setReady(true)
      return
    }

    let mounted = true
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return
      if (error) console.error(error)
      setSession(data.session)
      setReady(true)
    })

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) setSession(nextSession)
    })

    return () => {
      mounted = false
      data.subscription.unsubscribe()
    }
  }, [])

  const toggleLanguage = () => setLang((current) => current === 'en' ? 'fa' : 'en')

  if (!ready) return <div className="splash">{t.loading}</div>
  if (!isSupabaseConfigured) return <ConfigScreen lang={lang} toggleLanguage={toggleLanguage} />
  if (!session) return <AuthScreen lang={lang} toggleLanguage={toggleLanguage} />
  return <Dashboard session={session} lang={lang} toggleLanguage={toggleLanguage} />
}
