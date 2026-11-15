import { useEffect, useState } from 'react';
import { EditorStudio } from './EditorStudio';
import { StudioIcon } from './StudioIcon';
import { getAdminSessionState, subscribeAdminState } from './adminAuth';
import { hydratePublishedCloudAssetsFromIndexedDb, syncPublishedCloudAssetsToBrowserCache } from './cloudAssetLibrary';
import './editor-studio.css';
import './editor-pro.css';
import './template-previews-pro.css';
import './studio-polish.css';
import './studio-ribbon.css';
import './studio-reference.css';
import './studio-compact-ribbon.css';
import './studio-green-theme.css';
import './admin-asset-presets.css';
import './studio-tight-selection.css';
import './studio-multi-select.css';
import './precision-studio.css';
import './studio-contextual.css';
import './editor-persian-polish.css';
import './selection-controls.css';
import './components/ui/shine-border.css';
import './admin-access.css';
import './textFonts';
import './editor-startup.css';

const LIBRARY_REFRESH_COOLDOWN_MS = 30_000;

export function EditorRoute() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [editorReady, setEditorReady] = useState(false);
  const [loadingLibrary,setLoadingLibrary]=useState(true);
  const [libraryError,setLibraryError]=useState(false);
  const [libraryAttempt,setLibraryAttempt]=useState(0);

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
      setLoadingLibrary(true);
      setLibraryError(false);
      try {
        await syncPublishedCloudAssetsToBrowserCache();
      } catch {
        if(alive)setLibraryError(true);
      } finally {
        syncing = false;
        if(alive)setLoadingLibrary(false);
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
  }, [libraryAttempt]);

  useEffect(() => {
    if (!editorReady) return;
    let alive = true;
    void getAdminSessionState().then(state => { if (alive) setIsAdmin(state.isAdmin); });
    const unsubscribe = subscribeAdminState(state => { if (alive) setIsAdmin(state.isAdmin); });
    return () => { alive = false; unsubscribe(); };
  }, [editorReady]);

  return <>
    <EditorStudio onReady={() => setEditorReady(true)} loadingLibrary={loadingLibrary} libraryError={libraryError} onRetryLibrary={()=>setLibraryAttempt(value=>value+1)} />
    {isAdmin && <a className="editor-admin-shortcut" href="/admin/library" title="مدیریت کتابخانه" aria-label="مدیریت کتابخانه">
      <StudioIcon name="settings" />
      <span>مدیریت</span>
    </a>}
  </>;
}
