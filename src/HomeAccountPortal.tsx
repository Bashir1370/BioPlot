import { useEffect, useState } from 'react';
import {User} from '@phosphor-icons/react';
import { AccountState, accountDisplayName, getAccountState, subscribeAccountState } from './accountAuth';
import './home-account.css';

const emptyState: AccountState = { user: null, profile: null, isAdmin: false };

export function HomeAccountPortal({ locale }: { locale: 'en' | 'fa' }) {
  const [account, setAccount] = useState<AccountState>(emptyState);
  const [ready, setReady] = useState(false);
  const fa = locale === 'fa';

  useEffect(() => {
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

  const name = account.user ? accountDisplayName(account) : (fa ? 'حساب کاربری' : 'Account');
  const subtitle = account.user ? (account.isAdmin ? (fa ? 'مدیر' : 'Admin') : (fa ? 'پروفایل' : 'Profile')) : (fa ? 'ورود / ثبت‌نام' : 'Sign in / Sign up');

  return (
    <a className={`home-account-entry ${account.user ? 'signed-in' : ''} ${account.isAdmin ? 'is-admin' : ''}`} href={account.user?'/account':'/account?next=dashboard'} aria-label={fa ? 'حساب کاربری BioPlot' : 'BioPlot account'}>
      <span className="home-account-avatar" aria-hidden="true">{ready ? account.user ? <User size={20} weight="regular"/> : 'B' : '·'}</span>
      <span className="home-account-label"><b>{name}</b><small>{subtitle}</small></span>
      {account.isAdmin && <span className="home-account-admin-dot" title={fa ? 'مدیر BioPlot' : 'BioPlot administrator'}/>} 
    </a>
  );
}
