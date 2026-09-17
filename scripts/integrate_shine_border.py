"""Safely replace BioPlot's distracting border beam with a reusable ShineBorder.

The original aside elements remain the actual grid children (no layout wrapper).
Fail closed if the source changed instead of replacing or truncating editor code.
"""
from pathlib import Path


def replace_once(path: str, before: str, after: str) -> None:
    file = Path(path)
    source = file.read_text(encoding='utf-8')
    count = source.count(before)
    if count != 1:
        raise RuntimeError(f'{path}: expected exactly one integration anchor, found {count}: {before[:85]}')
    file.write_text(source.replace(before, after, 1), encoding='utf-8')


component = Path('src/components/ui/shine-border.tsx')
stylesheet = Path('src/components/ui/shine-border.css')
legacy = Path('src/editor-panel-beam.css')
for path in (component, stylesheet, legacy):
    if not path.is_file():
        raise RuntimeError(f'Required file missing: {path}')

editor = 'src/EditorStudio.tsx'
replace_once(
    editor,
    "import { AssetCatalogView, StudioPagesPanel, CanvasSettingsForm } from './StudioReferencePanels';",
    "import { AssetCatalogView, StudioPagesPanel, CanvasSettingsForm } from './StudioReferencePanels';\nimport { ShineBorder } from './components/ui/shine-border';",
)
replace_once(
    editor,
    "      <aside dir={fa?'rtl':'ltr'} className={`studio-library ${libraryCollapsed?'collapsed':''}`}>",
    "      <ShineBorder as=\"aside\" dir={fa?'rtl':'ltr'} className={`studio-library ${libraryCollapsed?'collapsed':''}`} borderRadius={12} borderWidth={1.25} duration={18} color={['#d9e9e6','#74beb4','#d9e9e6']}>",
)
replace_once(
    editor,
    "        </>}\n      </aside>\n      <div className={`studio-splitter library-splitter",
    "        </>}\n      </ShineBorder>\n      <div className={`studio-splitter library-splitter",
)

panels = 'src/StudioReferencePanels.tsx'
replace_once(
    panels,
    "import { StudioIcon } from './StudioIcon';",
    "import { StudioIcon } from './StudioIcon';\nimport { ShineBorder } from './components/ui/shine-border';",
)
replace_once(
    panels,
    "  return <aside className=\"reference-pages\" dir={fa?'rtl':'ltr'}>",
    "  return <ShineBorder as=\"aside\" className=\"reference-pages\" dir={fa?'rtl':'ltr'} borderRadius={12} borderWidth={1.25} duration={20} color={['#d9e9e6','#74beb4','#d9e9e6']}>",
)
replace_once(panels, '</div></aside>;', '</div></ShineBorder>;')

replace_once(
    'src/main.tsx',
    "import './editor-panel-beam.css';",
    "import './components/ui/shine-border.css';",
)
legacy.unlink()

assert Path(editor).read_text(encoding='utf-8').count('<ShineBorder as="aside"') == 1
assert Path(panels).read_text(encoding='utf-8').count('<ShineBorder as="aside"') == 1
assert not legacy.exists()
print('ShineBorder integrated into both existing editor side panels; old beam removed.')
