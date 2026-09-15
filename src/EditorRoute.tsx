import { useEffect, useState } from 'react';
import { EditorStudio } from './EditorStudio';
import { StudioIcon } from './StudioIcon';
import { getAdminSessionState, subscribeAdminState } from './adminAuth';
import { syncPublishedCloudAssetsToBrowserCache } from './cloudAssetLibrary';
import './admin-access.css';

const LIBRARY_REFRESH_COOLDOWN_MS = 30_000;

type IdleCapableWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout?: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

export function EditorRoute() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let alive = true;
    let syncing = false;
    let lastSyncStartedAt = 0;
    let fallbackTimer: number | undefined;
    let idleHandle: number | undefined;
    const idleWindow = window as IdleCapableWindow;

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

    // Do not hold the editor behind the cloud library request. Let React paint the
    // workspace first, then start the heavier network/SVG work when the browser is idle.
    if (idleWindow.requestIdleCallback) {
      idleHandle = idleWindow.requestIdleCallback(() => {
        void refreshLibrary();
      }, { timeout: 1200 });
    } else {
      fallbackTimer = window.setTimeout(() => {
        void refreshLibrary();
      }, 250);
    }

    const onFocus = () => { void refreshLibrary(); };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') void refreshLibrary();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      alive = false;
      if (fallbackTimer !== undefined) window.clearTimeout(fallbackTimer);
      if (idleHandle !== undefined) idleWindow.cancelIdleCallback?.(idleHandle);
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
