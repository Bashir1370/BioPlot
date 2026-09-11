import { useEffect, useState } from 'react';
import { EditorStudio } from './EditorStudio';
import { StudioIcon } from './StudioIcon';
import { getAdminSessionState, subscribeAdminState } from './adminAuth';
import { syncPublishedCloudAssetsToBrowserCache } from './cloudAssetLibrary';
import './admin-access.css';

export function EditorRoute() {
  const [libraryReady, setLibraryReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let alive = true;
    void syncPublishedCloudAssetsToBrowserCache()
      .catch(() => 0)
      .finally(() => { if (alive) setLibraryReady(true); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    let alive = true;
    void getAdminSessionState().then(state => { if (alive) setIsAdmin(state.isAdmin); });
    const unsubscribe = subscribeAdminState(state => { if (alive) setIsAdmin(state.isAdmin); });
    return () => { alive = false; unsubscribe(); };
  }, []);

  if (!libraryReady) {
    return <div className="editor-cloud-loading"><span>B</span><strong>BioPlot</strong><small>در حال همگام‌سازی کتابخانه علمی…</small></div>;
  }

  return <>
    <EditorStudio />
    {isAdmin && <a className="editor-admin-shortcut" href="/admin/library" title="مدیریت کتابخانه" aria-label="مدیریت کتابخانه">
      <StudioIcon name="settings" />
      <span>مدیریت</span>
    </a>}
  </>;
}
