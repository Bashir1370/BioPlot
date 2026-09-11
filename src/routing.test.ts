import { describe, expect, it } from 'vitest';
import { isAdminLibraryPath, isEditorPath } from './routing';

describe('editor route detection', () => {
  it('accepts Vite and Cloudflare editor URLs', () => {
    expect(isEditorPath('/editor.html')).toBe(true);
    expect(isEditorPath('/editor')).toBe(true);
    expect(isEditorPath('/editor/')).toBe(true);
  });

  it('does not treat the dashboard as the editor', () => {
    expect(isEditorPath('/')).toBe(false);
    expect(isEditorPath('/index.html')).toBe(false);
    expect(isEditorPath('/projects')).toBe(false);
  });
});

describe('admin library route detection',()=>{
  it('recognizes the no-code library manager route',()=>{
    expect(isAdminLibraryPath('/admin/library')).toBe(true);
    expect(isAdminLibraryPath('/admin/library/')).toBe(true);
  });
  it('does not shadow the editor or dashboard',()=>{
    expect(isAdminLibraryPath('/editor')).toBe(false);
    expect(isAdminLibraryPath('/')).toBe(false);
  });
});
