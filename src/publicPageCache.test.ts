import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {createPublicPageCache} from './publicPageCache';
const valid = (value: unknown): value is string[] => Array.isArray(value) && value.every(item => typeof item === 'string');
beforeEach(() => {
  vi.useFakeTimers();
  const values = new Map<string,string>();
  vi.stubGlobal('localStorage', {getItem: (key:string) => values.get(key) ?? null, setItem: (key:string,value:string) => values.set(key,value)});
});
afterEach(() => {vi.useRealTimers();vi.unstubAllGlobals();});
describe('public CMS cache', () => {
  it('renders persisted content without waiting for the network', () => {
    localStorage.setItem('page', JSON.stringify(['saved']));
    const load = vi.fn();
    expect(createPublicPageCache('page',load,valid).read()).toEqual(['saved']);
    expect(load).not.toHaveBeenCalled();
  });
  it('shares simultaneous requests and throttles focus refreshes', async () => {
    const load = vi.fn().mockResolvedValue(['fresh']);
    const cache = createPublicPageCache('page',load,valid);
    const first = cache.refresh(true);
    expect(cache.refresh(true)).toBe(first);
    await first;
    await cache.refresh();
    expect(load).toHaveBeenCalledTimes(1);
    await cache.refresh(true);
    expect(load).toHaveBeenCalledTimes(2);
  });
  it('keeps successful data after failures but accepts intentional deletion', async () => {
    const load = vi.fn().mockResolvedValueOnce(['saved']).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([]);
    const cache = createPublicPageCache('page',load,valid);
    await cache.refresh(true);
    await expect(cache.refresh(true)).rejects.toThrow('offline');
    expect(cache.read()).toEqual(['saved']);
    await cache.refresh(true);
    expect(cache.read()).toEqual([]);
    expect(JSON.parse(localStorage.getItem('page')!)).toEqual([]);
  });
  it('ignores invalid persisted data and supports blocked browser storage', async () => {
    localStorage.setItem('page','{"private":"wrong shape"}');
    expect(createPublicPageCache('page',vi.fn(),valid).read()).toBeUndefined();
    vi.stubGlobal('localStorage',{getItem:()=>{throw Error('blocked');},setItem:()=>{throw Error('blocked');}});
    const cache = createPublicPageCache('page',async()=>['fresh'],valid);
    expect(cache.read()).toBeUndefined();
    await cache.refresh();
    expect(cache.read()).toEqual(['fresh']);
  });
  it('aborts slow requests and allows recovery', async () => {
    const load = vi.fn((signal:AbortSignal) => new Promise<string[]>((_,reject) => signal.addEventListener('abort',()=>reject(Error('timeout')))));
    const cache = createPublicPageCache('page',load,valid);
    const failed = expect(cache.refresh()).rejects.toThrow('timeout');
    await vi.advanceTimersByTimeAsync(10_000);
    await failed;
    load.mockImplementation(async()=>['recovered']);
    await expect(cache.refresh(true)).resolves.toEqual(['recovered']);
  });
});
