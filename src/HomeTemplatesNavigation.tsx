import { useEffect } from 'react';

export function HomeTemplatesNavigation() {
  useEffect(() => {
    const syncTemplatesExperience = () => {
      document.querySelectorAll<HTMLAnchorElement>('a[href="#templates"]').forEach(link => {
        link.setAttribute('href', 'templates.html');
      });

      const legacyTemplatesSection = document.querySelector<HTMLElement>('#templates');
      if (legacyTemplatesSection) legacyTemplatesSection.hidden = true;
    };

    syncTemplatesExperience();
    const observer = new MutationObserver(syncTemplatesExperience);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
