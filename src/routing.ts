function normalizedPath(pathname:string){return pathname.replace(/\/+$/,'')||'/';}

export function isEditorPath(pathname: string) {
  const normalized = normalizedPath(pathname);
  return normalized === '/editor' || normalized === '/editor.html' || normalized.endsWith('/editor') || normalized.endsWith('/editor.html');
}

export function isAdminLibraryPath(pathname:string){
  const normalized=normalizedPath(pathname);
  return normalized==='/admin/library'||normalized.endsWith('/admin/library');
}

export function isAccountPath(pathname:string){
  const normalized=normalizedPath(pathname);
  return normalized==='/account'||normalized.endsWith('/account');
}
