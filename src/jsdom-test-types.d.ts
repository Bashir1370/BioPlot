// Minimal type declarations used by consent integration tests only.
declare module 'jsdom' {
  export class JSDOM {
    constructor(html?: string, options?: { url?: string; runScripts?: 'outside-only' | 'dangerously' });
    window: Window & typeof globalThis & { close(): void; eval(source: string): unknown };
  }
}
