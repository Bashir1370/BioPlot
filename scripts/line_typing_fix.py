"""Fix JSX callback capture: guard checks on array elements do not narrow inside closures."""
from pathlib import Path

path = Path('src/EditorStudio.tsx')
source = path.read_text(encoding='utf-8')
for property_name in ('startPoint', 'endPoint'):
    needle = f'selectedObjects[0].{property_name}'
    if needle not in source:
        raise RuntimeError(f'Expected generated endpoint expression missing: {needle}')
    replacement = f"(selectedObjects[0] as Extract<BioPlotObject,{{type:'arrow'}}>).{property_name}"
    source = source.replace(needle, replacement)
path.write_text(source, encoding='utf-8')
print('Endpoint JSX type narrowing fixed')
