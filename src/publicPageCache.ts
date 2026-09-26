/** Small, public CMS payloads only. Never use this cache for accounts or projects. */
export function createPublicPageCache<T>(key: string, load: (signal: AbortSignal) => Promise<T>, validate: (value: unknown) => value is T) {
  let value: T | undefined;
  let pending: Promise<T> | undefined;
  let lastAttempt = 0;
  const read = (): T | undefined => {
    if (value !== undefined) return value;
    try {
      const raw = localStorage.getItem(key);
      if (raw && raw.length < 100_000) {
        const stored = JSON.parse(raw);
        if (validate(stored)) value = stored;
      }
    } catch { /* Storage may be disabled; the network remains available. */ }
    return value;
  };
  const refresh = (force = false): Promise<T> => {
    if (pending) return pending;
    const cached = read();
    if (!force && cached !== undefined && Date.now() - lastAttempt < 60_000) return Promise.resolve(cached);
    lastAttempt = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    pending = load(controller.signal).then(next => {
      if (!validate(next)) throw new Error('Invalid public page content');
      value = next;
      try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* Keep the in-memory copy. */ }
      return next;
    }).finally(() => {
      clearTimeout(timer);
      pending = undefined;
    });
    return pending;
  };
  return {read, refresh};
}
