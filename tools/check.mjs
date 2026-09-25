import {readFileSync,existsSync} from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const sw=readFileSync('sw.js','utf8');
for(const [,file] of sw.slice(sw.indexOf('const ASSETS'),sw.indexOf('];')).matchAll(/'([^']+)'/g))assert.ok(existsSync(file.split('?')[0]),file);
assert.match(sw,/startsWith\('fancy-jumping-car-'\)/);
assert.ok(!readFileSync('index.html','utf8').includes('unpkg.com'));
console.log('Super Kart: local assets and cache isolation verified');

// Execute the real input functions and interruption registrations. No renderer
// or substitute input implementation is used by this regression test.
const source=readFileSync('src/main.js','utf8');
const release=source.slice(source.indexOf('function releaseInput()'),source.indexOf('/* ─── DOM REFERENCES'));
const bindings=source.slice(source.indexOf('function bindControls()'),source.indexOf('function bindColorPicker()'));
const interruptions=source.split('\n').filter(line=>/^window\.addEventListener\('blur'|^document\.addEventListener\('visibilitychange'/.test(line)).join('\n');
function eventTarget(){
  const handlers=new Map();
  return {addEventListener(type,callback){const list=handlers.get(type)||[];list.push(callback);handlers.set(type,list);},emit(type,event={}){for(const callback of handlers.get(type)||[])callback(event);}};
}
const testWindow=eventTarget(),testDocument=eventTarget(),touch=eventTarget(),classes=new Set();
touch.dataset={control:'right'};
touch.classList={add(name){classes.add(name);},remove(name){classes.delete(name);}};
const input={left:false,right:false,action:false,reverse:false};
vm.runInNewContext(release+bindings+'\nbindControls();\n'+interruptions,{input,controlButtons:[touch],window:testWindow,document:testDocument});
for(const interruption of ['blur','visibilitychange','pointercancel']){
  testWindow.emit('keydown',{key:'ArrowLeft'});
  touch.emit('pointerdown',{preventDefault(){}});
  assert.equal(input.left,true);assert.equal(input.right,true);assert(classes.has('active'));
  if(interruption==='blur')testWindow.emit('blur');
  else if(interruption==='pointercancel')touch.emit('pointercancel');
  else{testDocument.hidden=true;testDocument.emit('visibilitychange');}
  assert(Object.values(input).every(value=>value===false),interruption+' must release all input');
  assert.equal(classes.size,0,interruption+' must remove the pressed-button visual');
}
console.log('Super Kart: production keyboard/touch handlers release state and visuals on blur, hidden document and pointer cancellation');
