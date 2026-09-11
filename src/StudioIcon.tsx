import type { CSSProperties } from 'react';

// Interface geometry shares one stroke, grid and optical size.
const paths = {
  assets: 'M4 4h6v6H4z M14 4h6v6h-6z M4 14h6v6H4z M14 14h6v6h-6z',
  elements: 'M4 4h8v8H4z M15 15h6v6h-6z M18 3v7 M14.5 6.5h7 M7 16v5 M4.5 18.5h5',
  upload: 'M12 16V3 M7 8l5-5 5 5 M4 15v5h16v-5',
  download: 'M12 3v13 M7 11l5 5 5-5 M4 16v5h16v-5',
  copy: 'M9 9h11v11H9z M15 5V3H3v12h2',
  duplicate: 'M8 8h13v13H8z M16 4H3v12 M11 14.5h7 M14.5 11v7',
  front: 'M3 3h12v12H3z M18 9h3v12H9v-3',
  back: 'M9 9h12v12H9z M15 6V3H3v12h3',
  group: 'M3 3h5v5H3z M16 3h5v5h-5z M3 16h5v5H3z M16 16h5v5h-5z M8 5h8 M5 8v8 M19 8v8 M8 19h8',
  ungroup: 'M3 3h6v6H3z M15 3h6v6h-6z M3 15h6v6H3z M15 15h6v6h-6z',
  lock: 'M5 10h14v11H5z M8 10V7a4 4 0 018 0v3 M12 14v3',
  unlock: 'M5 10h14v11H5z M8 10V7a4 4 0 018 0 M12 14v3',
  hide: 'M3 3l18 18 M10 5a13 13 0 0111 7 14 14 0 01-3 4 M6 6a16 16 0 00-3 6 13 13 0 0011 7 M10 10a3 3 0 004 4',
  trash: 'M3 6h18 M9 6V3h6v3 M6 6l1 15h10l1-15 M10 10v7 M14 10v7',
  left: 'M4 3v18 M8 5h12v5H8z M8 14h8v5H8z',
  center: 'M12 2v20 M4 5h16v5H4z M7 14h10v5H7z',
  right: 'M20 3v18 M4 5h12v5H4z M8 14h8v5H8z',
  top: 'M3 4h18 M5 8h5v12H5z M14 8h5v8h-5z',
  middle: 'M2 12h20 M5 4h5v16H5z M14 7h5v10h-5z',
  bottom: 'M3 20h18 M5 4h5v12H5z M14 8h5v8h-5z',
  horizontal: 'M3 3v18 M21 3v18 M6 8h4v8H6z M14 8h4v8h-4z',
  vertical: 'M3 3h18 M3 21h18 M8 6h8v4H8z M8 14h8v4H8z',
  settings: 'M4 6h16 M4 12h16 M4 18h16 M8 3v6 M16 9v6 M10 15v6',
  layers: 'M12 3l10 5-10 5L2 8z M2 12l10 5 10-5 M2 16l10 5 10-5',
  check: 'M8 12l3 3 5-6 M12 2l8 4v6c0 5-8 10-8 10S4 17 4 12V6z',
  close: 'M6 6l12 12 M6 18L18 6',
  search: 'M16 16l5 5 M18 10a8 8 0 11-16 0 8 8 0 0116 0',
  star: 'M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z',
  clock: 'M21 12a9 9 0 11-18 0 9 9 0 0118 0 M12 7v5l3 2',
  undo: 'M3 10h11a6 6 0 010 12 M3 10l5-5 M3 10l5 5',
  redo: 'M21 10H10a6 6 0 000 12 M21 10l-5-5 M21 10l-5 5',
  share: 'M8 12V3h13v13h-9 M14 3h7v7 M21 3L10 14 M8 7H3v14h14v-5',
  arrow: 'M20 12H4 M10 6l-6 6 6 6',
  panel: 'M3 4h18v16H3z M9 4v16',
  text: 'M4 4h16 M12 4v16 M8 20h8',
  rect: 'M4 4h16v16H4z',
  ellipse: 'M21 12a9 7 0 11-18 0 9 7 0 0118 0',
  connector: 'M3 5h7v14h11 M17 15l4 4-4 4',
  curve: 'M3 19C3 3 21 21 21 5 M17 9l4-4-4-4',
  image: 'M3 3h18v18H3z M3 17l6-6 4 4 3-3 5 5 M16 7h.01',
} as const;
export type StudioIconName = keyof typeof paths;
export function StudioIcon({name, style}:{name:StudioIconName;style?:CSSProperties}) {
  return <svg className="studio-ui-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" style={style}><path d={paths[name]}/></svg>;
}
