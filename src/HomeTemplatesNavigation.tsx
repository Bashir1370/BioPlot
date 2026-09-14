import { useEffect } from 'react';

export function HomeTemplatesNavigation() {
  useEffect(() => {
    const syncLinks = () => {
      document.querySelectorAll<HTMLAnchorElement>('a[href="#templates"]').forEach(link => {
        link.setAttribute('href', 'templates.html');
      });
    };

    syncLinks();
    const observer = new MutationObserver(syncLinks);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
