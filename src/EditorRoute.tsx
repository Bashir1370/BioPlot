import { useEffect, useState } from 'react';
import { EditorStudio } from './EditorStudio';
import { StudioIcon } from './StudioIcon';
import { getAdminSessionState, subscribeAdminState } from './adminAuth';
import { hydratePublishedCloudAssetsFromIndexedDb, syncPublishedCloudAssetsToBrowserCache } from './cloudAssetLibrary';
import './admin-access.css';

const LIBRARY_REFRESH_COOLDOWN_MS = 30_000;

export function EditorRoute() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let alive = true;
    let syncing = false;
    let lastSyncStartedAt = 0;

    const refreshLibrary = async () => {
      if (!alive || syncing) return;
      const now = Date.now();
      if (now - lastSyncStartedAt < LIBRARY_REFRESH_COOLDOWN_MS) return;

      syncing = true;
      lastSyncStartedAt = now;
      try {
        await syncPublishedCloudAssetsToBrowserCache();
      } catch {
        // The editor and the local/cached asset catalog stay usable if the cloud is slow or offline.
      } finally {
        syncing = false;
      }
    };

    // Race local disk and network instead of serializing them. If IndexedDB has
    // a warm cache it can paint first; if it is empty/blocked, Supabase is already
    // in flight and is never delayed by browser-storage startup. Both paths emit
    // the library-changed event when they have usable data.
    void hydratePublishedCloudAssetsFromIndexedDb().catch(() => []);
    void refreshLibrary();

    const onFocus = () => { void refreshLibrary(); };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') void refreshLibrary();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      alive = false;
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  useEffect(() => {
    let alive = true;
    void getAdminSessionState().then(state => { if (alive) setIsAdmin(state.isAdmin); });
    const unsubscribe = subscribeAdminState(state => { if (alive) setIsAdmin(state.isAdmin); });
    return () => { alive = false; unsubscribe(); };
  }, []);

  return <>
    <EditorStudio />
    {isAdmin && <a className="editor-admin-shortcut" href="/admin/library" title="مدیریت کتابخانه" aria-label="مدیریت کتابخانه">
      <StudioIcon name="settings" />
      <span>مدیریت</span>
    </a>}
  </>;
}
