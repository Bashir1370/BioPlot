// @vitest-environment jsdom
import {describe,expect,it} from 'vitest';
import {sanitizeSvg} from './assets';
describe('scientific SVG ingestion',()=>{
 it('removes executable nodes, event attributes and external resources',()=>{
  const safe=sanitizeSvg('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)" xml:base="https://outside.test/"><script>alert(1)</script><foreignObject><div>HTML</div></foreignObject><image href="https://outside.test/a.png"/><rect onclick="alert(1)" fill="url(https://outside.test/a.svg)"/><animate attributeName="href" to="javascript:alert(1)"/></svg>');
  const root=new DOMParser().parseFromString(safe,'image/svg+xml');
  expect(root.querySelector('script,foreignObject,animate')).toBeNull();
  expect(safe).not.toMatch(/onload|onclick|javascript:|outside\.test|xml:base/);
 });
 it('keeps editable gradients, transforms and approved raster data images',()=>{
  const safe=sanitizeSvg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 20"><defs><linearGradient id="paint"><stop stop-color="#fff"/></linearGradient></defs><g transform="translate(1 2)"><rect fill="url(#paint)" width="10" height="10"/></g><image href="data:image/png;base64,iVBORw0KGgo=" width="10" height="10"/></svg>');
  expect(safe).toContain('linearGradient');expect(safe).toContain('url(#paint)');
  expect(safe).toContain('data:image/png;base64,');expect(safe).toContain('translate(1 2)');
 });
 it('rejects malformed SVG instead of inserting parser errors',()=>{
  expect(()=>sanitizeSvg('<svg><g></svg>')).toThrow('Invalid SVG');
 });
});
