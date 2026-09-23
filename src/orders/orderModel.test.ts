import {describe,it,expect} from 'vitest';
import {allowedTransitions,validateOrderFile,validBrief,orderReturnPath,MAX_FILE_SIZE} from './orderModel';
import {isDesignPath,isOrdersPath,isAdminOrdersPath,isEditorPath,isDashboardPath} from '../routing';
describe('design order flow',()=>{
 it('requires client quote and preview approval before production and delivery',()=>{
  expect(allowedTransitions('quoted',false)).toContain('accepted');
  expect(allowedTransitions('quoted',true)).not.toContain('accepted');
  expect(allowedTransitions('review',false)).toContain('approved');
  expect(allowedTransitions('review',true)).not.toContain('delivered');
  expect(allowedTransitions('approved',true)).toContain('delivered');
  expect(allowedTransitions('completed',true)).toEqual([]);
 });
 it('validates supported attachments and meaningful briefs',()=>{
  expect(validateOrderFile({name:'paper.pdf',size:MAX_FILE_SIZE})).toBe(true);
  expect(validateOrderFile({name:'diagram.SVG',size:40})).toBe(true);
  for(const file of [{name:'x.html',size:10},{name:'x.pdf.exe',size:10},{name:'x.png',size:0},{name:'x.pdf',size:MAX_FILE_SIZE+1}])expect(validateOrderFile(file)).toBe(false);
  const brief={route:'idea' as const,message:'A mechanism of cellular signaling in cancer.',audience:'',requirements:'',style:'',formats:['SVG']};
  expect(validBrief('Cancer figure',brief)).toBe(true);
  expect(validBrief('Cancer figure',{...brief,message:'short'})).toBe(false);
  expect(validBrief('Cancer figure',{...brief,formats:[]})).toBe(false);
 });
 it('uses allowlisted sign-in destinations and distinct routes',()=>{
  expect(orderReturnPath('orders_new')).toBe('/orders?new=1');
  expect(orderReturnPath('https://evil.example')).toBeNull();
  expect(isDesignPath('/design/')).toBe(true);expect(isOrdersPath('/orders')).toBe(true);
  expect(isAdminOrdersPath('/admin/orders')).toBe(true);expect(isOrdersPath('/admin/orders')).toBe(false);
  expect(isEditorPath('/editor')).toBe(true);expect(isDashboardPath('/dashboard')).toBe(true);
 });
});
