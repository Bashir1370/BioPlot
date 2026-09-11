export function isEditorPath(pathname: string) {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  return normalized === '/editor' || normalized === '/editor.html' || normalized.endsWith('/editor') || normalized.endsWith('/editor.html');
}
