import { describe, expect, it } from 'vitest';
import { isAccountPath } from './routing';

describe('BioPlot account routing', () => {
  it('matches account routes with optional trailing slash', () => {
    expect(isAccountPath('/account')).toBe(true);
    expect(isAccountPath('/account/')).toBe(true);
    expect(isAccountPath('/workspace/account')).toBe(true);
  });

  it('does not match unrelated routes', () => {
    expect(isAccountPath('/')).toBe(false);
    expect(isAccountPath('/admin/library')).toBe(false);
    expect(isAccountPath('/editor')).toBe(false);
  });
});
