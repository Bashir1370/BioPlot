import { useEffect, useState } from 'react';
import { EditorStudio } from './EditorStudio';
import { StudioIcon } from './StudioIcon';
import { getAdminSessionState, subscribeAdminState } from './adminAuth';
import { hydratePublishedCloudAssetsFromIndexedDb, syncPublishedCloudAssetsToBrowserCache } from './cloudAssetLibrary';
import './admin-access.css';

const LIBRARY_REFRESH_COOLDOWN_MS = 30_000;

// Start local-disk hydration as soon as this route module is evaluated. This is
// deliberately separate from the network refresh, so cached images can appear
// before React's first post-paint effect runs.
const initialLibraryHydration =
  typeof window !== 'undefined'
    ? hydratePublishedCloudAssetsFromIndexedDb().catch(() => [])
    : Promise.resolve([]);


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

    // IndexedDB is local and usually resolves within a frame or two. Refresh
    // Supabase only after local hydration so stale network timing can never delay
    // (or overwrite) the fast cached first view.
    void initialLibraryHydration.finally(() => {
      void refreshLibrary();
    });

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
