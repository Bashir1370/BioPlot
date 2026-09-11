import { describe, expect, it } from 'vitest';
import { isEditorPath } from './routing';

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
