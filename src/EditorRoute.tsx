import { useEffect, useRef, useState } from 'react';
import { EditorStudio } from './EditorStudio';
import { StudioIcon } from './StudioIcon';
import { getAdminSessionState, subscribeAdminState } from './adminAuth';
import { loadCustomAssets } from './assets';
import type { ScientificAsset } from './assets';
import { syncPublishedCloudAssetsToBrowserCache } from './cloudAssetLibrary';
import './admin-access.css';

function cloudLibrarySignature() {
  return JSON.stringify(
    loadCustomAssets()
      .filter(asset => Boolean((asset as ScientificAsset & { cloudManaged?: boolean }).cloudManaged))
      .map(asset => [
        asset.id,
        asset.version,
        asset.active,
        asset.featured,
        asset.premium,
        asset.reviewStatus,
        asset.sortOrder,
        asset.name,
        asset.nameFa,
        asset.category,
      ])
      .sort((a, b) => String(a[0]).localeCompare(String(b[0]))),
  );
}

export function EditorRoute() {
  const [libraryReady, setLibraryReady] = useState(false);
  const [libraryEpoch, setLibraryEpoch] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const librarySignatureRef = useRef('');

  useEffect(() => {
    let alive = true;
    let syncing = false;

    const refreshLibrary = async (initial = false) => {
      if (syncing) return;
      syncing = true;
      try {
        await syncPublishedCloudAssetsToBrowserCache();
        if (!alive) return;
        const nextSignature = cloudLibrarySignature();
        if (librarySignatureRef.current && librarySignatureRef.current !== nextSignature) {
          setLibraryEpoch(value => value + 1);
        }
        librarySignatureRef.current = nextSignature;
      } catch {
        // Keep the cached library available when the network is temporarily unavailable.
      } finally {
        syncing = false;
        if (initial && alive) setLibraryReady(true);
      }
    };

    void refreshLibrary(true);
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

  if (!libraryReady) {
    return <div className="editor-cloud-loading"><span>B</span><strong>BioPlot</strong><small>در حال همگام‌سازی کتابخانه علمی…</small></div>;
  }

  return <>
    <EditorStudio key={libraryEpoch} />
    {isAdmin && <a className="editor-admin-shortcut" href="/admin/library" title="مدیریت کتابخانه" aria-label="مدیریت کتابخانه">
      <StudioIcon name="settings" />
      <span>مدیریت</span>
    </a>}
  </>;
}
