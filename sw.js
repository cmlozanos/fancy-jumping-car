const CACHE='fancy-jumping-car-20260925-2';
const ASSETS=['./','index.html','styles.css?v=20260925-2','learning-gate.js?v=20260925-2','src/main.js?v=20260925-2','src/constants.js','src/portraits.js','src/physics.js','src/physics/carPhysics.js','src/physics/worldPhysics.js','vendor/three.module.js','vendor/addons/loaders/GLTFLoader.js','vendor/addons/utils/BufferGeometryUtils.js','manifest.webmanifest','icon.svg','icon-192.png','icon-512.png',
  'assets/models/Rock.glb','assets/models/Rock_2.glb','assets/models/Rock_3.glb','assets/models/Tree.glb','assets/models/Tree_2.glb','assets/models/Tree_3.glb','assets/sprites/ui_button_left.svg','assets/sprites/ui_button_right.svg','assets/sprites/ui_button_action.svg'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('fancy-jumping-car-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url), scope=new URL(self.registration.scope);
  if(e.request.method!=='GET'||url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
  e.respondWith(caches.open(CACHE).then(async c=>{
    if(e.request.mode==='navigate'){try{const r=await fetch(e.request);if(r.ok)return r;}catch(_){}return c.match('index.html');}
    const cached=await c.match(e.request);if(cached)return cached;
    const response=await fetch(e.request);if(response.ok)await c.put(e.request,response.clone());return response;
  }));
});
