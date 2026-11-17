import {orderReturnPath} from './orders/orderModel';
import { FormEvent, useEffect, useRef, useState } from 'react';
import {
  AccountState,
  accountDisplayName,
  getAccountState,
  signInUser,
  signOutUser,
  signUpUser,
  subscribeAccountState,
  updateUserProfile,
} from './accountAuth';
import {HomeHeader} from './HomeHeader';
import './account.css';

type Mode = 'signin' | 'signup';
type Locale = 'en' | 'fa';

const emptyState: AccountState = { user: null, profile: null, isAdmin: false };

const copy = {
  en: {
    title: 'Your BioPlot account', subtitle: 'One account for projects, preferences and administration.',
    signIn: 'Sign in', create: 'Create account', email: 'Email', password: 'Password', confirmPassword: 'Confirm password', name: 'Display name',
    have: 'Already have an account?', new: 'New to BioPlot?', switchSignIn: 'Sign in instead', switchCreate: 'Create an account',
    profile: 'Profile', role: 'Role', plan: 'Plan', language: 'Preferred language', save: 'Save profile', saved: 'Profile updated.',
    user: 'User', admin: 'Administrator', verified: 'Authenticated with Supabase', signOut: 'Sign out', home: 'Back to BioPlot', passwordMismatch: 'Passwords do not match.',
    adminTitle: 'BioPlot administration', adminText: 'Your account has administrator privileges. Manage the scientific asset library and publish content for all users.',
    openAdmin: 'Open admin panel', openEditor: 'Open Figure Studio', member: 'Member since',
    accountCreated: 'Your account was created. Sign in below with the same email and password.', confirm: 'Your account was created. If you receive an email confirmation link, confirm your email, then sign in below with the same email and password.', error: 'Something went wrong. Please try again.',
  },
  fa: {
    title: 'حساب کاربری BioPlot', subtitle: 'یک حساب برای پروژه‌ها، تنظیمات و دسترسی مدیریت.',
    signIn: 'ورود', create: 'ساخت حساب', email: 'ایمیل', password: 'رمز عبور', confirmPassword: 'تکرار رمز عبور', name: 'نام نمایشی',
    have: 'از قبل حساب داری؟', new: 'هنوز حساب نداری؟', switchSignIn: 'ورود به حساب', switchCreate: 'ساخت حساب جدید',
    profile: 'پروفایل', role: 'نقش', plan: 'پلن', language: 'زبان ترجیحی', save: 'ذخیره پروفایل', saved: 'پروفایل به‌روزرسانی شد.',
    user: 'کاربر', admin: 'مدیر سیستم', verified: 'ورود امن با Supabase', signOut: 'خروج از حساب', home: 'بازگشت به BioPlot', passwordMismatch: 'رمزهای عبور با هم مطابقت ندارند.',
    adminTitle: 'مدیریت BioPlot', adminText: 'این حساب دسترسی مدیر دارد. از اینجا کتابخانه علمی را مدیریت و محتوا را برای همه کاربران منتشر کن.',
    openAdmin: 'ورود به پنل مدیریت', openEditor: 'باز کردن Figure Studio', member: 'عضویت از',
    accountCreated: 'حساب شما ساخته شد؛ اکنون با همین ایمیل و رمز عبور وارد شوید.', confirm: 'حساب شما ساخته شد. اگر پیام تأیید ایمیل دریافت کردید، ایمیلتان را تأیید کنید؛ سپس با همین ایمیل و رمز عبور وارد شوید.', error: 'خطایی رخ داد. دوباره تلاش کن.',
  },
};

export function AccountPage() {
  const [locale, setLocale] = useState<Locale>(() => localStorage.getItem('bioplot-lang') === 'fa' ? 'fa' : 'en');
  const [account, setAccount] = useState<AccountState>(emptyState);
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [phone, setPhone] = useState('');
  function loadContact(state: AccountState) {
    const metadata = state.user?.user_metadata ?? {};
    const name = accountDisplayName(state).trim().split(/\s+/);
    setFirstName(metadata.first_name ?? name[0] ?? '');
    setLastName(metadata.last_name ?? name.slice(1).join(' '));
    setContactEmail(state.user?.email ?? '');
    setPhone(metadata.contact_phone ?? '');
  }
  const [preferredLanguage, setPreferredLanguage] = useState<Locale>(locale);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const authSubmitted = useRef(false);
  const requireExplicitSignIn = useRef(false);
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
      if (!mounted || authSubmitted.current) return;
      setAccount(state);
      const destination=orderReturnPath(new URLSearchParams(window.location.search).get('next'));if(state.user&&destination){window.location.href=destination;return;}
      if (state.user) setDisplayName(accountDisplayName(state));
      loadContact(state);
      setPreferredLanguage((state.profile?.preferred_language as Locale | undefined) ?? locale);
    }).catch(() => {/* Keep the sign-in form usable when session lookup fails. */});
    const unsubscribe = subscribeAccountState(state => {
      if (!mounted || (requireExplicitSignIn.current && state.user)) return;
      setAccount(state);
      if (state.user) {
        const destination=orderReturnPath(new URLSearchParams(window.location.search).get('next'));if(destination){window.location.href=destination;return;}
        if (state.user) setDisplayName(accountDisplayName(state));
      loadContact(state);
        setPreferredLanguage((state.profile?.preferred_language as Locale | undefined) ?? locale);
      }
    });
    return () => { mounted = false; unsubscribe(); };
  }, []);

  async function submitAuth(event: FormEvent) {
    event.preventDefault();
    if (!email.trim() || !password) return;
    if (mode === 'signup' && password !== confirmPassword) { setMessage(t.passwordMismatch); return; }
    authSubmitted.current = true;
    setBusy(true); setMessage('');
    try {
      if (mode === 'signup') {
        const { data, error } = await signUpUser(email, password, displayName, new URLSearchParams(window.location.search).get('next'));
        if (error) throw error;
        if (!data.user) throw new Error(t.error);

        if (data.session) {
          requireExplicitSignIn.current = true;
          try { await signOutUser(); } catch { /* Keep the sign-in form available if session cleanup fails. */ }
          setAccount(emptyState);
        }
        setMode('signin');
        setConfirmPassword('');
        setMessage(data.session ? t.accountCreated : t.confirm);
        return;
      }

      requireExplicitSignIn.current = false;
      const { data, error } = await signInUser(email, password);
      if (error) throw error;
      if (!data.session?.user) throw new Error(t.error);
      const destination=orderReturnPath(new URLSearchParams(window.location.search).get('next'));
      window.location.replace(destination ?? '/');
      return;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t.error);
    } finally { setBusy(false); }
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setMessage('');
    try {
      const result = await updateUserProfile({ displayName: `${firstName.trim()} ${lastName.trim()}`.trim(), preferredLanguage, firstName, lastName, phone, email: contactEmail });
      const state = await getAccountState();
      setAccount(state);
      setLocale(preferredLanguage);
      setMessage(result.emailChanged ? (fa ? 'اطلاعات ذخیره شد. برای تکمیل تغییر ایمیل، پیام تأیید را در ایمیل‌های فعلی و جدید بررسی کنید.' : 'Details saved. Check your current and new email inboxes to confirm the email change.') : t.saved);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t.error);
    } finally { setBusy(false); }
  }

  async function logout() {
    setBusy(true);
    try {
      await signOutUser();
      setAccount(emptyState);
      authSubmitted.current = false;
      setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t.error);
    } finally { setBusy(false); }
  }

  return <div className="account-page" dir={fa ? 'rtl' : 'ltr'}>
    <HomeHeader locale={locale} onLocaleChange={()=>setLocale(fa ? 'en' : 'fa')} currentPage={null}/>

    {!account.user ? <main className="account-auth-layout">
      <section className="account-auth-card" aria-label={mode === 'signin' ? t.signIn : t.create}>
        <div className="account-auth-tabs"><button className={mode === 'signin' ? 'active' : ''} onClick={() => { setMode('signin'); setConfirmPassword(''); setMessage(''); }}>{t.signIn}</button><button className={mode === 'signup' ? 'active' : ''} onClick={() => { setMode('signup'); setDisplayName(''); setEmail(''); setPassword(''); setConfirmPassword(''); setMessage(''); }}>{t.create}</button></div>
        <form key={mode} onSubmit={submitAuth} autoComplete={mode === 'signup' ? 'off' : 'on'}>
          {mode === 'signup' && <label>{t.name}<input dir="auto" style={{textAlign:'start'}} value={displayName} onChange={event => setDisplayName(event.target.value)} autoComplete="off"/></label>}
          <label>{t.email}<input dir="auto" style={{textAlign:'start'}} type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete={mode === 'signup' ? 'off' : 'email'} required/></label>
          <label>{t.password}<input dir="auto" style={{textAlign:'start'}} type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} minLength={6} required/></label>
          {mode === 'signup' && <label>{t.confirmPassword}<input dir="auto" style={{textAlign:'start'}} type="password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength={6} required aria-invalid={confirmPassword.length>0&&password!==confirmPassword}/></label>}
          <button className="account-primary" type="submit" disabled={busy}>{busy ? '…' : mode === 'signin' ? t.signIn : t.create}</button>
        </form>
        {message && <div className="account-message">{message}</div>}
      </section>
    </main> : <main className="account-simple-layout">
      <section className="account-card account-simple-card" aria-labelledby="account-details-title">
        <h1 id="account-details-title">{fa ? 'اطلاعات حساب' : 'Account details'}</h1>
        <form onSubmit={saveProfile}>
          <fieldset disabled={busy}>
            <label>{fa ? 'نام' : 'First name'}<input dir="auto" style={{textAlign:'start'}} autoComplete="given-name" value={firstName} onChange={event=>setFirstName(event.target.value)} required maxLength={100}/></label>
            <label>{fa ? 'نام خانوادگی' : 'Last name'}<input dir="auto" style={{textAlign:'start'}} autoComplete="family-name" value={lastName} onChange={event=>setLastName(event.target.value)} maxLength={100}/></label>
            <label>{t.email}<input dir="auto" style={{textAlign:'start'}} type="email" autoComplete="email" value={contactEmail} onChange={event=>setContactEmail(event.target.value)} required/></label>
            <label>{fa ? 'شماره تماس' : 'Phone number'}<input dir="auto" style={{textAlign:'start'}} type="tel" autoComplete="tel" value={phone} onChange={event=>setPhone(event.target.value)} maxLength={40}/></label>
            <div className="account-simple-actions"><button className="account-primary" type="submit">{busy ? '…' : fa ? 'ذخیره اطلاعات' : 'Save details'}</button><button className="account-secondary" type="button" onClick={logout}>{t.signOut}</button></div>
          </fieldset>
          {message && <p className="account-message" role="status">{message}</p>}
        </form>
      </section>
    </main>}
  </div>;
}
