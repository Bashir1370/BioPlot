import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { StudioIcon } from './StudioIcon';

export function AdminShowcaseAccountPortal() {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const fa = localStorage.getItem('bioplot-lang') === 'fa';

  useEffect(() => {
    let frame = 0;
    const find = () => {
      const card = document.querySelector<HTMLElement>('.account-admin-card');
      if (card) setTarget(card);
      else frame = requestAnimationFrame(find);
    };
    find();
    return () => cancelAnimationFrame(frame);
  }, []);

  if (!target) return null;
  return createPortal(
    <a className="account-primary account-admin-link" href="/admin/showcase" style={{ marginTop: 8 }}>
      <StudioIcon name="figure"/>{fa ? 'مدیریت تصاویر اختصاصی' : 'Manage portfolio showcase'}
    </a>,
    target,
  );
}
