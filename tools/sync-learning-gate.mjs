import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,readdirSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {createHash} from 'node:crypto';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const targets=['.'];
const canonical=null;
const catalogue=false;
const check=process.argv.includes('--check');
const sourceIndex=process.argv.indexOf('--source');
const source=sourceIndex>=0&&process.argv[sourceIndex+1]?resolve(process.argv[sourceIndex+1]):canonical;
assert.ok(check||source,'Copying requires --source /path/to/learning-gate; --check validates the local bundle without another repository.');
const names={'learning-gate.js':'gate.js','learning-profile.js':'profile.js','reading-words.js':'reading-words.js','READING_ASSETS.md':'READING_ASSETS.md','READING_WORDS.md':'READING_WORDS.md','reading-images/manifest.json':'reading-images/manifest.json'};
const read=(base,file)=>readFileSync(join(base,file));
function dictionary(base) {
  const scope={module:{exports:{}}};
  vm.runInNewContext(read(base,'reading-words.js').toString(),scope);
  const words=JSON.parse(JSON.stringify(scope.module.exports));
  assert.equal(words.length,100,'reading dictionary contains exactly 100 words');
  assert.equal(new Set(words.map(word=>word.id)).size,100,'reading image IDs are unique');
  for(const word of words) {
    assert.ok(typeof word.word==='string'&&Number.isInteger(word.id)&&Array.isArray(word.groups),'valid reading entry');
  }
  return words;
}
function imageNames(base) {
  return dictionary(base).map(word=>'reading-images/'+word.id+'.png');
}
let snapshot;
if(source) {
  snapshot=new Map(Object.entries(names).map(([target,file])=>[target,read(source,file)]));
  for(const file of imageNames(source))snapshot.set(file,read(source,file));
}
for(const target of targets) {
  const base=resolve(root,target);
  if(!check) {
    mkdirSync(join(base,'reading-images'),{recursive:true});
    for(const [file,bytes] of snapshot)writeFileSync(join(base,file),bytes);
  }
  const images=imageNames(base);
  const files=[...Object.keys(names),...images];
  for(const file of files) {
    const bytes=read(base,file);
    if(snapshot)assert.ok(bytes.equals(snapshot.get(file)),target+': stale bundle copy '+file);
    if(file.endsWith('.js'))new vm.Script(bytes.toString(),{filename:file});
  }
  assert.deepEqual(readdirSync(join(base,'reading-images')).filter(file=>file.endsWith('.png')).sort(),images.map(file=>file.split('/')[1]).sort(),target+': exactly the 100 dictionary images');
  let imageBytes=0;
  const manifest=JSON.parse(read(base,'reading-images/manifest.json')).images;
  assert.equal(manifest.length,100,target+': provenance covers all 100 images');
  assert.deepEqual(manifest.map(item=>item.id).sort((a,b)=>a-b),dictionary(base).map(item=>item.id).sort((a,b)=>a-b),target+': manifest matches dictionary IDs');
  for(const file of images) {
    const png=read(base,file);imageBytes+=png.length;
    const provenance=manifest.find(item=>file==='reading-images/'+item.id+'.png');
    assert.equal(createHash('sha256').update(png).digest('hex'),provenance.sha256,file+': exact approved image hash');
    assert.equal(png.length,provenance.bytes,file+': provenance byte count');
    assert.equal(png.toString('hex',0,8),'89504e470d0a1a0a',file+': PNG signature');
    assert.ok(png.readUInt32BE(16)>0&&png.readUInt32BE(16)<=300&&png.readUInt32BE(20)>0&&png.readUInt32BE(20)<=300,file+': original 300px image bounds');
  }
  assert.ok(imageBytes<=2000000,target+': reading images stay within the approved 2 MB budget');
  const html=read(target==='public'?root:base,'index.html').toString();
  const profile=html.indexOf('learning-profile.js'),words=html.indexOf('reading-words.js'),gate=html.indexOf('learning-gate.js');
  assert.ok(profile>=0&&profile<words&&words<gate,target+': load local profile, words, then gate');
  for(const file of ['learning-profile.js','reading-words.js','learning-gate.js']) {
    const tag=[...html.matchAll(/<script\b[^>]*src="([^"]+)"[^>]*>/g)].map(match=>match[1]).find(url=>url.split('?')[0].endsWith(file));
    assert.ok(tag&&!/^https?:/.test(tag),target+': local script '+file);
    const version=file==='reading-words.js'?'20260928-1':'20260928-4';
    assert.ok(tag.includes('v='+version)||tag.includes('v=__BUILD_VERSION__'),target+': versioned bundle '+file);
  }
  if(target==='public') {
    const config=read(root,'vite.config.ts').toString();
    for(const file of Object.keys(names))assert.ok(config.includes('"'+file+'"'),file+': Vite PWA includes the reading bundle');
    assert.ok(config.includes('"reading-images/*.png"'),'Vite PWA includes every reading PNG');
  } else {
    const context=vm.createContext({self:{addEventListener(){}}});
    context.importScripts=file=>vm.runInContext(read(base,file).toString(),context);
    vm.runInContext(read(base,'sw.js').toString(),context);
    const assets=vm.runInContext('typeof ASSETS!=="undefined"?ASSETS:typeof FILES!=="undefined"?FILES:typeof PRECACHE_URLS!=="undefined"?PRECACHE_URLS:OFFLINE_ASSETS',context);
    const normalized=Array.from(assets,url=>url.replace(/^\.\//,'').split('?')[0]);
    for(const file of files)assert.ok(normalized.includes(file),target+': missing offline bundle resource '+file);
  }
  console.log(target+': '+(check?'verified':'synchronized')+' profile, gate, 100 words/images and local offline loading ('+imageBytes+' image bytes)');
}
if(catalogue) {
  const profile=snapshot?snapshot.get('learning-profile.js'):read(resolve(root,targets[0]),'learning-profile.js');
  if(!check)writeFileSync(join(root,'learning-profile.js'),profile);
  assert.ok(read(root,'learning-profile.js').equals(profile),'catalogue profile matches the game bundle');
}
