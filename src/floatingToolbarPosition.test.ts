import {describe,it,expect} from 'vitest';
import {floatingToolbarPosition as place} from './floatingToolbarPosition';
const viewport={left:100,top:50,right:1000,bottom:700};
const size={width:320,height:90};
describe('context toolbar screen placement',()=>{
 it('centers above selection with a gap for rotation handles',()=>{
  expect(place({left:400,top:300,right:500,bottom:400},viewport,size)).toEqual({left:290,top:176,visible:true});
 });
 it('flips below objects near the top and clamps at either horizontal edge',()=>{
  expect(place({left:105,top:55,right:150,bottom:100},viewport,size)).toEqual({left:110,top:134,visible:true});
  expect(place({left:920,top:55,right:990,bottom:100},viewport,size).left).toBe(670);
 });
 it('keeps controls inside a viewport even when a large selection fills it',()=>{
  expect(place({left:90,top:20,right:1100,bottom:800},viewport,size).top).toBe(600);
 });
 it('hides when the selected object has scrolled out of view',()=>{
  expect(place({left:20,top:20,right:80,bottom:40},viewport,size).visible).toBe(false);
 });
});
