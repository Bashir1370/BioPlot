import { useEffect } from 'react';
import './home-projects-mode.css';

function isProjectsHash() {
  return window.location.hash === '#projects';
}

export function HomeProjectsMode() {
  useEffect(() => {
    let observer: MutationObserver | null = null;

    const revealAllProjects = () => {
      const section = document.querySelector<HTMLElement>('#projects');
      if (!section) return;
      const button = section.querySelector<HTMLButtonElement>('.home-text-button');
      const label = button?.textContent?.trim() ?? '';
      if (button && (/view all projects/i.test(label) || label.includes('همه پروژه'))) button.click();
    };

    const sync = () => {
      const projectsView = isProjectsHash();
      const shell = document.querySelector<HTMLElement>('.home-shell');
      shell?.classList.toggle('home-projects-view', projectsView);

      const homeLink = document.querySelector<HTMLElement>('.home-nav a[href="#home"]');
      const projectsLink = document.querySelector<HTMLElement>('.home-nav a[href="#projects"]');
      homeLink?.classList.toggle('active', !projectsView);
      projectsLink?.classList.toggle('active', projectsView);

      observer?.disconnect();
      observer = null;

      if (projectsView) {
        window.requestAnimationFrame(() => {
          window.scrollTo({ top: 0, behavior: 'auto' });
          revealAllProjects();
        });
        const section = document.querySelector<HTMLElement>('#projects');
        if (section) {
          observer = new MutationObserver(revealAllProjects);
          observer.observe(section, { childList: true, subtree: true });
        }
      }
    };

    sync();
    window.addEventListener('hashchange', sync);
    return () => {
      window.removeEventListener('hashchange', sync);
      observer?.disconnect();
      document.querySelector<HTMLElement>('.home-shell')?.classList.remove('home-projects-view');
    };
  }, []);

  return null;
}
