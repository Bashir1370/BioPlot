import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  AccountState,
  accountDisplayName,
  accountInitial,
  getAccountState,
  signInUser,
  signOutUser,
  signUpUser,
  subscribeAccountState,
  updateUserProfile,
} from './accountAuth';
import { StudioIcon } from './StudioIcon';
import './account.css';

type Mode = 'signin' | 'signup';
type Locale = 'en' | 'fa';

const emptyState: AccountState = { user: null, profile: null, isAdmin: false };

const copy = {
  en: {
    title: 'Your BioPlot account', subtitle: 'One account for projects, preferences and administration.',
    signIn: 'Sign in', create: 'Create account', email: 'Email', password: 'Password', name: 'Display name',
    signInText: 'Sign in to continue to your BioPlot workspace.', createText: 'Create your BioPlot account and keep your workspace identity in one place.',
    have: 'Already have an account?', new: 'New to BioPlot?', switchSignIn: 'Sign in instead', switchCreate: 'Create an account',
    profile: 'Profile', role: 'Role', plan: 'Plan', language: 'Preferred language', save: 'Save profile', saved: 'Profile updated.',
    user: 'User', admin: 'Administrator', verified: 'Authenticated with Supabase', signOut: 'Sign out', home: 'Back to BioPlot',
    adminTitle: 'BioPlot administration', adminText: 'Your account has administrator privileges. Manage the scientific asset library and publish content for all users.',
    openAdmin: 'Open admin panel', openEditor: 'Open Figure Studio', member: 'Member since',
    confirm: 'Account created. Check your email if confirmation is required, then sign in.', error: 'Something went wrong. Please try again.',
  },
  fa: {
    title: 'حساب کاربری BioPlot', subtitle: 'یک حساب برای پروژه‌ها، تنظیمات و دسترسی مدیریت.',
    signIn: 'ورود', create: 'ساخت حساب', email: 'ایمیل', password: 'رمز عبور', name: 'نام نمایشی',
    signInText: 'برای ورود به فضای کاری BioPlot وارد حساب خود شو.', createText: 'حساب BioPlot خودت را بساز تا هویت و تنظیمات فضای کاری در یک جا نگه‌داری شود.',
    have: 'از قبل حساب داری؟', new: 'هنوز حساب نداری؟', switchSignIn: 'ورود به حساب', switchCreate: 'ساخت حساب جدید',
    profile: 'پروفایل', role: 'نقش', plan: 'پلن', language: 'زبان ترجیحی', save: 'ذخیره پروفایل', saved: 'پروفایل به‌روزرسانی شد.',
    user: 'کاربر', admin: 'مدیر سیستم', verified: 'ورود امن با Supabase', signOut: 'خروج از حساب', home: 'بازگشت به BioPlot',
    adminTitle: 'مدیریت BioPlot', adminText: 'این حساب دسترسی مدیر دارد. از اینجا کتابخانه علمی را مدیریت و محتوا را برای همه کاربران منتشر کن.',
    openAdmin: 'ورود به پنل مدیریت', openEditor: 'باز کردن Figure Studio', member: 'عضویت از',
    confirm: 'حساب ساخته شد. اگر تأیید ایمیل لازم است، ایمیلت را تأیید کن و سپس وارد شو.', error: 'خطایی رخ داد. دوباره تلاش کن.',
  },
};

export function AccountPage() {
  const [locale, setLocale] = useState<Locale>(() => localStorage.getItem('bioplot-lang') === 'fa' ? 'fa' : 'en');
  const [account, setAccount] = useState<AccountState>(emptyState);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState<Locale>(locale);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const t = copy[locale];
  const fa = locale === 'fa';

  useEffect(() => {
    document.documentElement.dir = fa ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;
    localStorage.setItem('bioplot-lang', locale);
  }, [locale, fa]);

  useEffect(() => {
    let mounted = true;
    void getAccountState().then(state => {
      if (!mounted) return;
      setAccount(state);
      setDisplayName(accountDisplayName(state));
      setPreferredLanguage((state.profile?.preferred_language as Locale | undefined) ?? locale);
      setLoading(false);
    });
    const unsubscribe = subscribeAccountState(state => {
      if (!mounted) return;
      setAccount(state);
      if (state.user) {
        setDisplayName(accountDisplayName(state));
        setPreferredLanguage((state.profile?.preferred_language as Locale | undefined) ?? locale);
      }
      setLoading(false);
    });
    return () => { mounted = false; unsubscribe(); };
  }, []);

  async function submitAuth(event: FormEvent) {
    event.preventDefault();
    if (!email.trim() || !password) return;
    setBusy(true); setMessage('');
    try {
      if (mode === 'signup') {
        const { data, error } = await signUpUser(email, password, displayName);
        if (error) throw error;
        if (!data.session) setMessage(t.confirm);
      } else {
        const { error } = await signInUser(email, password);
        if (error) throw error;
      }
      const state = await getAccountState();
      setAccount(state);
      if (state.user) {
        setDisplayName(accountDisplayName(state));
        setPreferredLanguage((state.profile?.preferred_language as Locale | undefined) ?? locale);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t.error);
    } finally { setBusy(false); }
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setMessage('');
    try {
      await updateUserProfile({ displayName, preferredLanguage });
      const state = await getAccountState();
      setAccount(state);
      setLocale(preferredLanguage);
      setMessage(t.saved);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t.error);
    } finally { setBusy(false); }
  }

  async function logout() {
    setBusy(true);
    await signOutUser();
    setAccount(emptyState);
    setBusy(false);
    setMessage('');
  }

  const joined = useMemo(() => {
    const raw = account.profile?.created_at ?? account.user?.created_at;
    if (!raw) return '—';
    return new Intl.DateTimeFormat(fa ? 'fa-IR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(raw));
  }, [account.profile?.created_at, account.user?.created_at, fa]);

  if (loading) return <div className="account-page account-loading"><div className="account-loader"/><span>BioPlot</span></div>;

  return <div className="account-page" dir={fa ? 'rtl' : 'ltr'}>
    <header className="account-topbar">
      <a className="account-brand" href="/"><span>B</span><div><b>BioPlot</b><small>Figure Studio</small></div></a>
      <div className="account-top-actions">
        <button className="account-lang" onClick={() => setLocale(fa ? 'en' : 'fa')}>{fa ? 'EN' : 'FA'}</button>
        <a className="account-home-link" href="/"><StudioIcon name="arrow"/>{t.home}</a>
      </div>
    </header>

    {!account.user ? <main className="account-auth-layout">
      <section className="account-auth-intro">
        <span className="account-kicker">BIOPLOT ACCOUNT</span>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
        <div className="account-benefits">
          <span><StudioIcon name="check"/>Projects and workspace identity</span>
          <span><StudioIcon name="check"/>Persian + English preferences</span>
          <span><StudioIcon name="check"/>Secure Supabase authentication</span>
        </div>
      </section>
      <section className="account-auth-card">
        <div className="account-auth-tabs"><button className={mode === 'signin' ? 'active' : ''} onClick={() => { setMode('signin'); setMessage(''); }}>{t.signIn}</button><button className={mode === 'signup' ? 'active' : ''} onClick={() => { setMode('signup'); setMessage(''); }}>{t.create}</button></div>
        <div className="account-auth-heading"><h2>{mode === 'signin' ? t.signIn : t.create}</h2><p>{mode === 'signin' ? t.signInText : t.createText}</p></div>
        <form onSubmit={submitAuth}>
          {mode === 'signup' && <label>{t.name}<input value={displayName} onChange={event => setDisplayName(event.target.value)} autoComplete="name"/></label>}
          <label>{t.email}<input type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" required/></label>
          <label>{t.password}<input type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} minLength={6} required/></label>
          <button className="account-primary" type="submit" disabled={busy}>{busy ? '…' : mode === 'signin' ? t.signIn : t.create}</button>
        </form>
        {message && <div className="account-message">{message}</div>}
        <div className="account-auth-switch"><span>{mode === 'signin' ? t.new : t.have}</span><button onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>{mode === 'signin' ? t.switchCreate : t.switchSignIn}</button></div>
      </section>
    </main> : <main className="account-dashboard">
      <section className="account-welcome">
        <div className="account-avatar-large">{accountInitial(account)}</div>
        <div><span className="account-kicker">BIOPLOT ACCOUNT</span><h1>{accountDisplayName(account)}</h1><p>{account.user.email}</p></div>
        <div className="account-badges"><span className={account.isAdmin ? 'admin' : ''}>{account.isAdmin ? t.admin : t.user}</span><span><StudioIcon name="check"/>{t.verified}</span></div>
      </section>

      <div className="account-grid">
        <section className="account-card account-profile-card">
          <div className="account-card-head"><div><span className="account-card-icon"><StudioIcon name="settings"/></span><div><h2>{t.profile}</h2><p>{account.user.email}</p></div></div></div>
          <form onSubmit={saveProfile}>
            <label>{t.name}<input value={displayName} onChange={event => setDisplayName(event.target.value)}/></label>
            <div className="account-field-grid"><label>{t.language}<select value={preferredLanguage} onChange={event => setPreferredLanguage(event.target.value as Locale)}><option value="en">English</option><option value="fa">فارسی</option></select></label><label>{t.plan}<input value={(account.profile?.plan ?? 'free').toUpperCase()} readOnly/></label></div>
            <div className="account-meta-row"><span>{t.role}<b>{account.isAdmin ? t.admin : t.user}</b></span><span>{t.member}<b>{joined}</b></span></div>
            <div className="account-form-footer"><button className="account-primary" type="submit" disabled={busy}>{t.save}</button>{message && <span>{message}</span>}</div>
          </form>
        </section>

        <section className="account-card account-workspace-card">
          <span className="account-card-icon"><StudioIcon name="canvas"/></span>
          <h2>Figure Studio</h2>
          <p>{fa ? 'مستقیماً وارد فضای طراحی علمی شو و پروژه‌هایت را ادامه بده.' : 'Open your scientific workspace and continue designing your figures.'}</p>
          <a className="account-secondary" href="/editor"><StudioIcon name="canvas"/>{t.openEditor}</a>
        </section>

        {account.isAdmin && <section className="account-card account-admin-card">
          <div className="account-admin-accent"><StudioIcon name="settings"/></div>
          <span className="account-kicker">ADMIN ACCESS</span>
          <h2>{t.adminTitle}</h2>
          <p>{t.adminText}</p>
          <div className="account-admin-features"><span><StudioIcon name="check"/>Scientific asset library</span><span><StudioIcon name="check"/>Categories & publishing</span><span><StudioIcon name="check"/>Global user content</span></div>
          <a className="account-primary account-admin-link" href="/admin/library"><StudioIcon name="settings"/>{t.openAdmin}</a>
        </section>}
      </div>

      <section className="account-security-strip"><div><span className="account-card-icon"><StudioIcon name="lock"/></span><div><b>{fa ? 'جلسه امن' : 'Secure session'}</b><small>{account.user.email}</small></div></div><button onClick={logout} disabled={busy}>{t.signOut}</button></section>
    </main>}
  </div>;
}
