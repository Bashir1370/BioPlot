#!/usr/bin/env python3
"""Restore corner resize controls for native paths without rewriting the editor."""
from pathlib import Path

ROOT = Path('src')

def replace_one(source: str, old: str, new: str, filename: str) -> str:
    matches = source.count(old)
    if matches != 1:
        raise RuntimeError(f'{filename}: expected one exact match, got {matches}')
    return source.replace(old, new, 1)

studio_path = ROOT / 'EditorStudio.tsx'
css_path = ROOT / 'line-polish.css'
studio = studio_path.read_text(encoding='utf-8')
css = css_path.read_text(encoding='utf-8')

old_handles = "{!selectedLine&&['nw','n','ne','e','se','s','sw','w'].map(handle=><button key={handle} className={`studio-handle ${handle}`} onPointerDown={event=>beginResize(event,handle)}/>)}"
new_handles = "{(selectedLine?['nw','ne','se','sw']:['nw','n','ne','e','se','s','sw','w']).map(handle=><button key={handle} type=\"button\" aria-label={`${handle} resize handle`} title={fa?'تغییر اندازه':'Resize'} className={`studio-handle ${handle}`} onPointerDown={event=>beginResize(event,handle)}/>)}"
studio = replace_one(studio, old_handles, new_handles, 'EditorStudio.tsx')

old_style = '.studio-selection.bp-path-selected .studio-handle{display:none!important}'
new_style = '''/* Four polished corner handles belong to the selection frame, not the path nodes. */
.studio-selection.bp-path-selected .studio-handle{display:block!important;width:9px;height:9px;padding:0;border:1.5px solid #168e84;border-radius:3px;background:#fff;box-shadow:0 1px 3px #073d3a22;pointer-events:auto;touch-action:none;z-index:18;transition:border-color .12s,background-color .12s,box-shadow .12s}
.studio-selection.bp-path-selected .studio-handle.nw{left:-5px;top:-5px}
.studio-selection.bp-path-selected .studio-handle.ne{right:-5px;top:-5px}
.studio-selection.bp-path-selected .studio-handle.se{right:-5px;bottom:-5px}
.studio-selection.bp-path-selected .studio-handle.sw{left:-5px;bottom:-5px}
.studio-selection.bp-path-selected .studio-handle::before{content:'';position:absolute;inset:-5px}
.studio-selection.bp-path-selected .studio-handle:hover{border-color:#087f79;background:#effbf8;box-shadow:0 0 0 2px #168e8426}
.studio-selection.bp-path-selected .studio-handle:focus-visible{outline:2px solid #087f79;outline-offset:3px}'''
css = replace_one(css, old_style, new_style, 'line-polish.css')

# Validate the intended scope before writing either file.
assert "selectedLine?['nw','ne','se','sw']" in studio
assert '.studio-selection.bp-path-selected .studio-handle{display:none!important}' not in css
assert all(f'.studio-handle.{corner}' in css for corner in ('nw', 'ne', 'se', 'sw'))
studio_path.write_text(studio, encoding='utf-8')
css_path.write_text(css, encoding='utf-8')
print('Restored four corner-only resize handles; native path nodes and rotation unchanged.')
