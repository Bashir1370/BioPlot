import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AccountState, accountDisplayName, accountInitial, getAccountState, subscribeAccountState } from './accountAuth';
import './home-account.css';

const emptyState: AccountState = { user: null, profile: null, isAdmin: false };

export function HomeAccountPortal() {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [account, setAccount] = useState<AccountState>(emptyState);
  const [ready, setReady] = useState(false);
  const fa = localStorage.getItem('bioplot-lang') === 'fa';

  useEffect(() => {
    setTarget(document.querySelector<HTMLElement>('.home-top-actions'));
    let mounted = true;
    void getAccountState().then(state => {
      if (!mounted) return;
      setAccount(state);
      setReady(true);
    });
    const unsubscribe = subscribeAccountState(state => {
      if (!mounted) return;
      setAccount(state);
      setReady(true);
    });
    return () => { mounted = false; unsubscribe(); };
  }, []);

  if (!target) return null;

  const name = account.user ? accountDisplayName(account) : (fa ? 'حساب کاربری' : 'Account');
  const subtitle = account.user ? (account.isAdmin ? (fa ? 'مدیر' : 'Admin') : (fa ? 'پروفایل' : 'Profile')) : (fa ? 'ورود / ثبت‌نام' : 'Sign in / Sign up');
  const initial = account.user ? accountInitial(account) : 'B';

  return createPortal(
    <a className={`home-account-entry ${account.user ? 'signed-in' : ''} ${account.isAdmin ? 'is-admin' : ''}`} href="/account" aria-label={fa ? 'حساب کاربری BioPlot' : 'BioPlot account'}>
      <span className="home-account-avatar">{ready ? initial : '·'}</span>
      <span className="home-account-label"><b>{name}</b><small>{subtitle}</small></span>
      {account.isAdmin && <span className="home-account-admin-dot" title={fa ? 'مدیر BioPlot' : 'BioPlot administrator'}/>} 
    </a>,
    target,
  );
}
