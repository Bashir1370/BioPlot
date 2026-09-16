import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import './admin-lines.css';

/** Place the line preset manager beside existing library navigation without
 * changing library forms, data, or the admin access gate. */
export function AdminLinesShortcut() {
  const [nav, setNav] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const find = () => setNav(current => {
      const found = document.querySelector<HTMLElement>('.admin-header nav');
      return current === found ? current : found;
    });
    find();
    if (document.querySelector('.admin-header nav')) return;
    const observer = new MutationObserver(() => {
      if (!document.querySelector('.admin-header nav')) return;
      find(); observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  return nav ? createPortal(<a className="admin-lines-navlink" href="/admin/lines">خطوط و فلش‌ها</a>, nav) : null;
}
