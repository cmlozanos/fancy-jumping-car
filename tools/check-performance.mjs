import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as THREE from '../vendor/three.module.js';
import {CONFIG} from '../src/constants.js';
import {createFixedStepper,readLightMode,LIGHT_PIXEL_RATIO} from '../src/performance.js';

const source=readFileSync('src/main.js','utf8');
function section(start,end){return source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start)));}
const physics=vm.createContext({THREE,CONFIG});
for(const path of ['carPhysics','worldPhysics']) {
  vm.runInContext(readFileSync(`src/physics/${path}.js`,'utf8').replace(/^import .*;\n/gm,'').replace('export function','function'),physics);
}
function run(fps,fixed=true) {
  const state={speed:30,lateral:0,lateralVel:0,progress:0,jumpY:0,jumpVel:0,rampJumped:false,turboActive:0,starActive:0};
  const car=new THREE.Group(),ground=new THREE.Group();
  const track={halfWidth:12,total:2040};
  const trackOps={getCurvature:()=>0.0003,getPoint:(t,p)=>new THREE.Vector3(0,0,p*t.total),getTangent:()=>new THREE.Vector3(0,0,1)};
  let ticks=0, peakJump=0, collided=false;
  const update=delta=>{
    const elapsed=ticks++*(fixed?1/60:1/fps);
    const input={action:elapsed>=1&&elapsed<4,reverse:elapsed>=7,left:elapsed>=3&&elapsed<4,right:elapsed>=5&&elapsed<6};
    physics.updateCarPhysics({delta,state,input,track,trackOps,car,ground,ramps:[{t:0.01,progressHalf:0.002,lateral:0,frontWidth:10,backWidth:10,height:3}]});
    physics.updateWorldPhysics({delta,state,track,obstacles:[{t:0.03,lateral:0,progressHalf:0.002,lateralHalf:12,height:12}],trees:[],turboPads:[],trampolines:[],lavaZones:[],mudZones:[],starItems:[]});
    peakJump=Math.max(peakJump,state.jumpY);collided ||= state.collisionHit;
  };
  const stepper=createFixedStepper(update);
  for(let frame=0;frame<fps*10;frame++) fixed?stepper.advance(1/fps):update(1/fps);
  return {state:JSON.parse(JSON.stringify(state)),ticks,peakJump,collided};
}
const baseline=run(60,false);
for(const fps of [10,15,30,60]) assert.deepEqual(run(fps),baseline,`real ramp/collision/curve/reverse physics at ${fps} FPS must match original 60 Hz`);
assert.ok(baseline.peakJump>0,'fixture must exercise a ramp');
assert.ok(baseline.collided,'fixture must exercise collision');
let updates=0;const stepper=createFixedStepper(()=>updates++);
assert.equal(stepper.advance(5),15,'long stalls are bounded to 250 ms');
stepper.advance(1/120);stepper.reset();assert.equal(stepper.advance(1/120),0,'pause discards pending fraction');
assert.equal(readLightMode({getItem:()=>null}),true);
assert.equal(readLightMode({getItem:()=> 'true'}),true);
assert.equal(readLightMode({getItem:()=> 'false'}),false,'explicit normal preference must survive the new default');
assert.equal(readLightMode({getItem(){throw Error('blocked');}}),true);
assert.equal(LIGHT_PIXEL_RATIO**2,0.42250000000000004);
console.log('Physics: exact original 60 Hz results at 10/15/30/60 FPS; ramp peak',baseline.peakJump.toFixed(3),'m; collisions exercised. Light mode raster area: 42.25% of normal.');

function panel(hidden){return {hidden,classList:{contains(){return this.owner.hidden;},owner:null}};}
const panels=['titleScreen','vehicleMenu','levelMenu'].map(()=>panel(true));
panels.forEach(p=>p.classList.owner=p);
let mainRenders=0,previewRenders=0,advance=0,queued=0,cancelled=0,paused=false,released=0;
const lifecycle=vm.createContext({educationLocked:false,document:{hidden:false},titleScreen:panels[0],vehicleMenu:panels[1],levelMenu:panels[2],raceBlocked:false,
  releaseInput(){released++;},fixedSimulation:{reset(){},advance(){advance++;}},clock:{getDelta:()=>1/60},lastHudUpdate:0,
  gameTimers:{pause(){paused=true;},resume(){paused=false;}},audioCtx:null,
  prevRenderer:{render(){previewRenders++;}},prevKartGroup:{rotation:{y:0}},prevScene:{},prevCamera:{},prevAnimId:null,
  requestAnimationFrame(){return ++queued;},cancelAnimationFrame(){cancelled++;},educationGate:{check(){}},state:{countdownActive:false},
  updateStarAppearance(){},uploadParticles(){},updateEngineSound(){},updateHud(){},renderer:{render(){mainRenders++;}},scene:{},camera:{}});
vm.runInContext(section('function animatePreview()','function applyQuality()')+section('function animate()','function bindControls()'),lifecycle);
for(const p of panels) {
  p.hidden=false;lifecycle.syncActivity();assert.equal(paused,true);lifecycle.animate();assert.equal(mainRenders,0);assert.equal(advance,0);
  p.hidden=true;lifecycle.syncActivity();assert.equal(paused,false);
}
panels[1].hidden=false;lifecycle.syncActivity();assert.notEqual(lifecycle.prevAnimId,null);lifecycle.animatePreview();assert.equal(previewRenders,1);
panels[1].hidden=true;lifecycle.syncActivity();assert.equal(lifecycle.prevAnimId,null);assert.ok(cancelled>0);
lifecycle.animatePreview();assert.equal(previewRenders,1,'late hidden preview callback must not render');
lifecycle.document.hidden=true;lifecycle.syncActivity();lifecycle.animate();assert.equal(mainRenders,0);
lifecycle.document.hidden=false;lifecycle.educationLocked=true;lifecycle.syncActivity();lifecycle.animate();assert.equal(mainRenders,0);
lifecycle.educationLocked=false;lifecycle.syncActivity();lifecycle.animate();assert.equal(mainRenders,1);assert.equal(advance,1);assert.ok(released>0);
console.log('Production lifecycle: zero main renders/physics under title, selectors, hidden document or challenge; preview RAF cancelled on close.');

const material=new THREE.MeshStandardMaterial({color:0x336699,emissive:0x001122,emissiveIntensity:0.3});
const original={color:material.color.clone(),emissive:material.emissive.clone(),intensity:material.emissiveIntensity,version:material.version};
let traversals=0;
const star=vm.createContext({state:{starActive:1},starMaterials:new Map(),flashColor:new THREE.Color(),car:{traverse(fn){traversals++;fn({isMesh:true,material});fn({isMesh:true,material});}}});
vm.runInContext(section('function restoreStarAppearance()','function animate()'),star);
for(let i=0;i<60;i++)star.updateStarAppearance();
assert.equal(traversals,1);assert.equal(star.starMaterials.size,1);assert.equal(material.version,original.version,'uniform changes must not mark shader dirty');
star.state.starActive=0;star.updateStarAppearance();assert.ok(material.color.equals(original.color));assert.ok(material.emissive.equals(original.emissive));assert.equal(material.emissiveIntensity,original.intensity);assert.equal(star.starMaterials.size,0);
let now=0,writes=0;const hud={set textContent(value){writes++;}};
const hudContext=vm.createContext({performance:{now:()=>now},lastHudUpdate:-Infinity,state:{time:0,speed:0,progress:0},hudTime:hud,hudSpeed:hud,hudCollectible:hud,progressBarFill:null,progressBarCar:null});
vm.runInContext(section('function updateHud()','/* ─── COUNTDOWN'),hudContext);
for(let i=0;i<60;i++){now=i*1000/60;hudContext.updateHud();}
assert.ok(writes<=30,`HUD writes ${writes} must be capped at ten batches/second`);
console.log('Star: 60 frames -> one traversal, zero shader version updates; colors restored without rebuilding car. HUD:',writes,'text writes vs previous 180 per second.');

const qualityMaterial=new THREE.MeshStandardMaterial();
const quality=vm.createContext({window:{devicePixelRatio:2},lightMode:true,LIGHT_PIXEL_RATIO,renderer:{setPixelRatio(value){this.ratio=value;},shadowMap:{enabled:true}},prevRenderer:null,scene:{traverse(fn){fn({material:qualityMaterial});fn({material:qualityMaterial});}},document:{getElementById:()=>({setAttribute(){}})}});
vm.runInContext(section('function applyQuality()','function updatePreviewKart('),quality);
quality.applyQuality();assert.equal(qualityMaterial.version,1);assert.equal(quality.renderer.ratio,0.65);assert.equal(quality.renderer.shadowMap.enabled,false);
quality.applyQuality();assert.equal(qualityMaterial.version,1,'reapplying quality must not dirty shaders again');
quality.lightMode=false;quality.applyQuality();assert.equal(qualityMaterial.version,2);assert.equal(quality.renderer.ratio,1);assert.equal(quality.renderer.shadowMap.enabled,true);
console.log('Quality toggle: shadow shaders refresh once per change, shared materials once; normal settings restored.');
