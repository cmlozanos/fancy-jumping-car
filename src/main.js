import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { updatePhysics } from "./physics.js";
import { CONFIG } from "./constants.js";
import { getPortraitDataURL, drawCharacterPortrait } from "./portraits.js";

/* ─── DOM REFERENCES ─── */
const container = document.getElementById("game");
const hudTime = document.getElementById("hud-time");
const hudSpeed = document.getElementById("hud-speed");
const hudCheckpoint = document.getElementById("hud-checkpoint");
const finishPanel = document.getElementById("finish");
const finishTime = document.getElementById("finish-time");
const finishRestart = document.getElementById("finish-restart");
const finishNext = document.getElementById("finish-next");
const carColorInput = document.getElementById("car-color");
const openLevels = document.getElementById("open-levels");
const levelMenu = document.getElementById("level-menu");
const levelGrid = document.getElementById("level-grid");
const levelClose = document.getElementById("level-close");
const controlButtons = document.querySelectorAll(".control-btn");
const hudCollectible = document.getElementById("hud-collectible");
const hudLevel = document.getElementById("hud-level");
const deathFlash = document.getElementById("death-flash");
const titleScreen = document.getElementById("title-screen");
const titlePlay = document.getElementById("title-play");
const titleVehicles = document.getElementById("title-vehicles");
const vehicleMenu = document.getElementById("vehicle-menu");
const vehicleGrid = document.getElementById("vehicle-grid");
const vehicleClose = document.getElementById("vehicle-close");
const openCharacter = document.getElementById("open-character");
const finishCharacter = document.getElementById("finish-character");
const countdownOverlay = document.getElementById("countdown-overlay");
const countdownText = document.getElementById("countdown-text");
const progressBarFill = document.getElementById("progress-bar-fill");
const progressBarCar = document.getElementById("progress-bar-car");

/* ─── PERSISTENT STORAGE ─── */
const savedCarColor = (() => {
  const raw = window.localStorage.getItem("carColor");
  if (!raw) return "#ff2d2d";
  if (!/^#[0-9a-fA-F]{6}$/.test(raw)) return "#ff2d2d";
  return raw;
})();
const _rawKart = window.localStorage.getItem("selectedCharacter");
const savedKart = CONFIG.characters.some((c) => c.id === _rawKart) ? _rawKart : CONFIG.characters[0].id;

const state = {
  time: 0,
  speed: 0,
  lateral: 0,
  lateralVel: 0,
  progress: 0,
  jumpY: 0,
  jumpVel: 0,
  rampJumped: false,
  carColor: new THREE.Color(savedCarColor),
  levelKey: CONFIG.levels?.[0]?.key ?? "asfalto",
  checkpoints: CONFIG.hud.checkpoints,
  checkpointIndex: 0,
  finished: false,
  collectibleCollected: false,
  turboActive: 0,
  lavaHit: false,
  countdownActive: false,
  selectedKart: savedKart,
};

const input = {
  left: false,
  right: false,
  action: false,
  reverse: false,
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(CONFIG.colors.sky);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, CONFIG.render.pixelRatio));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.BasicShadowMap;
container.appendChild(renderer.domElement);

const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
dirLight.position.set(30, 60, -40);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 512;
dirLight.shadow.mapSize.height = 512;
dirLight.shadow.camera.near = 1;
dirLight.shadow.camera.far = 100;
dirLight.shadow.camera.left = -20;
dirLight.shadow.camera.right = 20;
dirLight.shadow.camera.top = 20;
dirLight.shadow.camera.bottom = -20;
scene.add(dirLight);

const sky = new THREE.Mesh(
  new THREE.SphereGeometry(600, 24, 16),
  new THREE.MeshBasicMaterial({ color: CONFIG.colors.sky, side: THREE.BackSide })
);
scene.add(sky);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(4000, 4000),
  new THREE.MeshStandardMaterial({ color: CONFIG.colors.ground })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.5;
ground.receiveShadow = true;
scene.add(ground);

const trackTexture = createTrackTexture();
let track;
let checkpoints;
let finishGate;
let startLine;
let obstacles;
let ramps;
let trees;
let turboPads;
let trampolines;
let lavaZones;
let mudZones;
let collectible;

const car = new THREE.Group();
const selectedChar = CONFIG.characters.find((c) => c.id === state.selectedKart) || CONFIG.characters[0];
const fallbackCar = buildCar(selectedChar.vehicle, selectedChar.color);
car.add(fallbackCar.root);
car.userData = {
  wheels: fallbackCar.wheels,
  wheelRadius: fallbackCar.wheelRadius,
  wheelSpin: 0,
  bodyMaterials: fallbackCar.bodyMaterials,
  model: fallbackCar.root,
  procedural: true,
};
car.position.y = CONFIG.car.baseY;
car.castShadow = true;
scene.add(car);
// Color per-character is baked into buildCar — color picker is disabled
if (carColorInput) carColorInput.closest('label')?.style && (carColorInput.closest('label').style.display = 'none');

/* ─── TURBO GLOW / AURA (B5/U2) ─── */
const turboGlow = new THREE.Mesh(
  new THREE.SphereGeometry(2.5, 12, 8),
  new THREE.MeshBasicMaterial({
    color: 0x00ffcc,
    transparent: true,
    opacity: 0,
    side: THREE.BackSide,
    depthWrite: false,
  })
);
turboGlow.scale.set(1.2, 0.6, 1.6);
car.add(turboGlow);

/* ─── GLB MODEL CACHE (B1/T1) ─── */
const modelCache = { rocks: null, trees: null };
function preloadModels() {
  const loader = new GLTFLoader();
  const rockPaths = ["assets/models/Rock.glb", "assets/models/Rock_2.glb", "assets/models/Rock_3.glb"];
  const treePaths = ["assets/models/Tree.glb", "assets/models/Tree_2.glb", "assets/models/Tree_3.glb"];
  const loadSet = (paths) => new Promise((resolve) => {
    const sources = [];
    let loaded = 0;
    paths.forEach((path) => {
      loader.load(path, (gltf) => {
        gltf.scene.traverse((c) => { if (c.isMesh) { c.castShadow = false; c.receiveShadow = false; } });
        sources.push(gltf.scene);
        if (++loaded === paths.length) resolve(sources);
      }, undefined, () => { if (++loaded === paths.length) resolve(sources); });
    });
  });
  loadSet(rockPaths).then((s) => { modelCache.rocks = s; if (obstacles) applyRockToObstacles(obstacles, s); });
  loadSet(treePaths).then((s) => { modelCache.trees = s; if (trees) applyTreesToObjects(trees, s); });
}
preloadModels();

/* ─── PARTICLE SYSTEM (G7) ─── */
const MAX_PARTICLES = 200;
const particlePositions = new Float32Array(MAX_PARTICLES * 3);
const particleColors = new Float32Array(MAX_PARTICLES * 3);
const particleSizes = new Float32Array(MAX_PARTICLES);
// Pre-fill positions off-screen so unused slots are invisible
particlePositions.fill(0); particleSizes.fill(0);
for (let i = 0; i < MAX_PARTICLES; i++) particlePositions[i * 3 + 1] = -100;
const particleGeo = new THREE.BufferGeometry();
particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
particleGeo.setAttribute("color", new THREE.BufferAttribute(particleColors, 3));
particleGeo.setAttribute("size", new THREE.BufferAttribute(particleSizes, 1));
const particleMat = new THREE.PointsMaterial({
  size: 0.4, vertexColors: true, transparent: true, opacity: 0.8, depthWrite: false,
  sizeAttenuation: true,
});
const particleMesh = new THREE.Points(particleGeo, particleMat);
scene.add(particleMesh);

const particles = [];
function spawnParticle(x, y, z, vx, vy, vz, r, g, b, life) {
  particles.push({ x, y, z, vx, vy, vz, r, g, b, life, maxLife: life });
}
function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    if (p.life <= 0) { particles.splice(i, 1); continue; }
    p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
    p.vy -= 9.8 * dt; // gravity
  }
  const count = Math.min(particles.length, MAX_PARTICLES);
  for (let i = 0; i < count; i++) {
    const p = particles[i];
    const fade = p.life / p.maxLife;
    particlePositions[i * 3] = p.x;
    particlePositions[i * 3 + 1] = p.y;
    particlePositions[i * 3 + 2] = p.z;
    particleColors[i * 3] = p.r * fade;
    particleColors[i * 3 + 1] = p.g * fade;
    particleColors[i * 3 + 2] = p.b * fade;
    particleSizes[i] = 0.3 + fade * 0.4;
  }
  particleGeo.attributes.position.needsUpdate = true;
  particleGeo.attributes.color.needsUpdate = true;
  particleGeo.attributes.size.needsUpdate = true;
  particleGeo.setDrawRange(0, count);
}

/* ─── SOUND SYSTEM (G5) ─── */
let audioCtx = null;
const sounds = {};
function initAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Create engine hum oscillator — triangle is smoother than sawtooth
  const engineGain = audioCtx.createGain();
  engineGain.gain.value = 0;
  // Low-pass filter to soften the tone further
  const engineFilter = audioCtx.createBiquadFilter();
  engineFilter.type = "lowpass";
  engineFilter.frequency.value = 220;
  engineFilter.connect(audioCtx.destination);
  engineGain.connect(engineFilter);
  const engineOsc = audioCtx.createOscillator();
  engineOsc.type = "triangle";
  engineOsc.frequency.value = 55;
  engineOsc.connect(engineGain);
  engineOsc.start();
  sounds.engineOsc = engineOsc;
  sounds.engineGain = engineGain;
}
function playSound(type) {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const gain = audioCtx.createGain();
  gain.connect(audioCtx.destination);
  const osc = audioCtx.createOscillator();
  osc.connect(gain);
  switch (type) {
    case "turbo":
      osc.type = "square"; osc.frequency.value = 300;
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.start(now); osc.stop(now + 0.5);
      break;
    case "collision":
      osc.type = "triangle"; osc.frequency.value = 120;
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now); osc.stop(now + 0.3);
      break;
    case "lava":
      osc.type = "sawtooth"; osc.frequency.value = 60;
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.start(now); osc.stop(now + 0.6);
      break;
    case "star":
      osc.type = "sine"; osc.frequency.setValueAtTime(523, now);
      osc.frequency.setValueAtTime(659, now + 0.1);
      osc.frequency.setValueAtTime(784, now + 0.2);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.start(now); osc.stop(now + 0.5);
      break;
    case "coin":
      osc.type = "square"; osc.frequency.setValueAtTime(988, now);
      osc.frequency.setValueAtTime(1319, now + 0.07);
      gain.gain.setValueAtTime(0.13, now);
      gain.gain.setValueAtTime(0.13, now + 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.start(now); osc.stop(now + 0.22);
      break;
    case "finish":
      osc.type = "sine"; osc.frequency.setValueAtTime(523, now);
      osc.frequency.setValueAtTime(659, now + 0.15);
      osc.frequency.setValueAtTime(784, now + 0.3);
      osc.frequency.setValueAtTime(1047, now + 0.45);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc.start(now); osc.stop(now + 0.8);
      break;
    case "countdown":
      osc.type = "sine"; osc.frequency.value = 440;
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now); osc.stop(now + 0.25);
      break;
    case "go":
      osc.type = "sine"; osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now); osc.stop(now + 0.4);
      break;
    case "trampoline":
      osc.type = "sine"; osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now); osc.stop(now + 0.3);
      break;
  }
}
function updateEngineSound(speed) {
  if (!sounds.engineOsc || !sounds.engineGain) return;
  const absSpeed = Math.abs(speed);
  // Simulate gear shifting: speed wraps within each gear range
  // so frequency rises then drops back when the next gear engages
  const gearRanges = [0, 10, 22, 35, 50]; // speed thresholds per gear
  let gear = 0;
  for (let g = gearRanges.length - 1; g >= 0; g--) {
    if (absSpeed >= gearRanges[g]) { gear = g; break; }
  }
  const gearMin = gearRanges[gear];
  const gearMax = gearRanges[gear + 1] ?? 70;
  const gearFrac = Math.min(1, (absSpeed - gearMin) / (gearMax - gearMin));
  // Frequency: low base per gear, rises within gear, caps at 180 Hz (not shrill)
  const baseFreq = 55 + gear * 8;
  const freq = baseFreq + gearFrac * 45;
  // Volume: gentle, quieter at low speed
  const vol = Math.min(0.04, (absSpeed / 50) * 0.04);
  sounds.engineGain.gain.value = vol;
  sounds.engineOsc.frequency.value = freq;
}

let world = { car, ground, obstacles: [], ramps: [], trees: [], turboPads: [], trampolines: [], lavaZones: [], mudZones: [], collectible: null };
const trackOps = {
  getPoint: getTrackPoint,
  getTangent: getTrackTangent,
  getCurvature: getTrackCurvature,
};

const clock = new THREE.Clock();

const WORLD_ICONS = {
  "Pradera": "�",
  "Desierto": "🏜️",
  "Montaña": "⭐",
  "Volcán": "🌋",
  "Ártico": "❄️",
  "Espacio": "🌈",
};

function buildLevelMenu() {
  if (!levelGrid || !Array.isArray(CONFIG.levels)) return;
  levelGrid.innerHTML = CONFIG.levels
    .map(
      (level, i) => `
        <button class="level-card" data-level="${level.key}" style="--thumb: ${level.thumbColor}">
          <div class="level-thumb"></div>
          <div class="level-number"><span class="level-world-icon">${WORLD_ICONS[level.world] ?? ""}</span>${i + 1}. ${level.world ?? ""}</div>
          <div class="level-title">${level.label}</div>
        </button>
      `
    )
    .join("");
  updateLevelMenuState();
}

function getLevelConfig(levelKey) {
  const levels = Array.isArray(CONFIG.levels) ? CONFIG.levels : [];
  return levels.find((item) => item.key === levelKey) ?? levels[0];
}

function disposeObject3D(obj) {
  if (!obj) return;
  obj.traverse((child) => {
    if (child.geometry) {
      child.geometry.dispose();
    }
    if (child.material) {
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach((m) => {
        if (m.map) m.map.dispose();
        if (m.emissiveMap) m.emissiveMap.dispose();
        if (m.normalMap) m.normalMap.dispose();
        m.dispose();
      });
    }
  });
}

function clearLevelScene() {
  if (track) {
    scene.remove(track.mesh, track.leftEdgeMesh, track.rightEdgeMesh);
    if (track.tailMesh) scene.remove(track.tailMesh);
    disposeObject3D(track.mesh);
    disposeObject3D(track.leftEdgeMesh);
    disposeObject3D(track.rightEdgeMesh);
    disposeObject3D(track.tailMesh);
  }
  if (checkpoints) {
    checkpoints.forEach((gate) => { scene.remove(gate); disposeObject3D(gate); });
  }
  if (finishGate) { scene.remove(finishGate); disposeObject3D(finishGate); }
  if (startLine) { scene.remove(startLine); disposeObject3D(startLine); }
  if (obstacles) obstacles.forEach((obstacle) => { scene.remove(obstacle.mesh); disposeObject3D(obstacle.mesh); });
  if (ramps) ramps.forEach((ramp) => { scene.remove(ramp.mesh); disposeObject3D(ramp.mesh); });
  if (trees) trees.forEach((tree) => { scene.remove(tree.mesh); disposeObject3D(tree.mesh); });
  if (turboPads) turboPads.forEach((pad) => { scene.remove(pad.mesh); disposeObject3D(pad.mesh); });
  if (trampolines) trampolines.forEach((tramp) => { scene.remove(tramp.mesh); disposeObject3D(tramp.mesh); });
  if (lavaZones) lavaZones.forEach((zone) => { scene.remove(zone.mesh); disposeObject3D(zone.mesh); });
  if (mudZones) mudZones.forEach((zone) => { scene.remove(zone.mesh); disposeObject3D(zone.mesh); });
  if (collectible) { scene.remove(collectible.mesh); disposeObject3D(collectible.mesh); }
}

function initLevel(levelKey) {
  clearLevelScene();
  const level = getLevelConfig(levelKey);
  if (!level) return;

  track = buildTrack(trackTexture, level);
  scene.add(track.mesh, track.leftEdgeMesh, track.rightEdgeMesh);
  if (track.tailMesh) scene.add(track.tailMesh);

  checkpoints = buildCheckpoints(track);
  checkpoints.forEach((gate) => scene.add(gate));

  finishGate = buildFinishGate(track);
  scene.add(finishGate);

  startLine = buildStartLine(track);
  scene.add(startLine);

  obstacles = buildObstacles(track, level);
  obstacles.forEach((obstacle) => scene.add(obstacle.mesh));
  if (modelCache.rocks) applyRockToObstacles(obstacles, modelCache.rocks);

  ramps = buildRamps(track, obstacles);
  ramps.forEach((ramp) => scene.add(ramp.mesh));

  trees = buildTrees(track, level);
  trees.forEach((tree) => scene.add(tree.mesh));
  if (modelCache.trees) applyTreesToObjects(trees, modelCache.trees);

  turboPads = buildTurboPads(track, level);
  turboPads.forEach((pad) => scene.add(pad.mesh));

  trampolines = buildTrampolines(track, level);
  trampolines.forEach((tramp) => scene.add(tramp.mesh));

  lavaZones = buildLavaZones(track, level);
  lavaZones.forEach((zone) => scene.add(zone.mesh));

  mudZones = buildMudZones(track, level);
  mudZones.forEach((zone) => scene.add(zone.mesh));

  collectible = buildCollectible(track, level);
  if (collectible) scene.add(collectible.mesh);

  world = { car, ground, obstacles, ramps, trees, turboPads, trampolines, lavaZones, mudZones, collectible };
}

function updateLevelMenuState() {
  if (!levelGrid) return;
  levelGrid.querySelectorAll(".level-card").forEach((card) => {
    const isActive = card.dataset.level === state.levelKey;
    card.classList.toggle("active", isActive);
  });
}

function getNextLevelKey() {
  const levels = Array.isArray(CONFIG.levels) ? CONFIG.levels : [];
  const index = levels.findIndex((level) => level.key === state.levelKey);
  if (index < 0 || index + 1 >= levels.length) return null;
  return levels[index + 1].key;
}

function buildTrack(texture, level) {
  const length = level?.trackLength ?? CONFIG.track.length;
  const segments = CONFIG.track.segments;
  const halfWidth = CONFIG.track.halfWidth;
  const tailLength = CONFIG.track.tailLength;
  const points = [];
  const distances = [];
  let total = 0;

  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const z = t * length;
    const x =
      Math.sin(t * CONFIG.track.curvatureMajor) * CONFIG.track.curvatureMajorAmp +
      Math.sin(t * CONFIG.track.curvatureMinor) * CONFIG.track.curvatureMinorAmp;
    points.push(new THREE.Vector3(x, 0, z));
    if (i > 0) {
      total += points[i].distanceTo(points[i - 1]);
    }
    distances.push(total);
  }

  const vertices = [];
  const uvs = [];
  const indices = [];
  const leftStrip = [];
  const rightStrip = [];
  const leftStripIndices = [];
  const rightStripIndices = [];

  for (let i = 0; i <= segments; i += 1) {
    const current = points[i];
    const next = points[Math.min(i + 1, segments)];
    const prev = points[Math.max(i - 1, 0)];
    const tangentSource = i === segments ? new THREE.Vector3().subVectors(current, prev) : new THREE.Vector3().subVectors(next, current);
    const tangent = tangentSource.normalize();
    const left = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

    const leftPoint = current.clone().addScaledVector(left, halfWidth);
    const rightPoint = current.clone().addScaledVector(left, -halfWidth);

    vertices.push(leftPoint.x, leftPoint.y, leftPoint.z);
    vertices.push(rightPoint.x, rightPoint.y, rightPoint.z);

    const leftOuter = leftPoint.clone().addScaledVector(left, CONFIG.track.edgeOffset);
    const rightOuter = rightPoint.clone().addScaledVector(left, -CONFIG.track.edgeOffset);

    leftStrip.push(leftPoint.x, leftPoint.y, leftPoint.z);
    leftStrip.push(leftOuter.x, leftOuter.y, leftOuter.z);
    rightStrip.push(rightPoint.x, rightPoint.y, rightPoint.z);
    rightStrip.push(rightOuter.x, rightOuter.y, rightOuter.z);

    const v = i / segments;
    uvs.push(0, v);
    uvs.push(1, v);

    if (i < segments) {
      const idx = i * 2;
      indices.push(idx, idx + 1, idx + 2);
      indices.push(idx + 1, idx + 3, idx + 2);

      const edgeIdx = i * 2;
      leftStripIndices.push(edgeIdx, edgeIdx + 1, edgeIdx + 2);
      leftStripIndices.push(edgeIdx + 1, edgeIdx + 3, edgeIdx + 2);
      rightStripIndices.push(edgeIdx, edgeIdx + 1, edgeIdx + 2);
      rightStripIndices.push(edgeIdx + 1, edgeIdx + 3, edgeIdx + 2);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    color: CONFIG.colors.track,
    map: texture,
    emissive: CONFIG.colors.trackEmissive,
    emissiveIntensity: 1.1,
    roughness: 0.9,
    metalness: 0.05,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  mesh.position.y = CONFIG.track.trackYOffset;

  const edgeMaterial = new THREE.MeshStandardMaterial({
    color: CONFIG.colors.edge,
    side: THREE.DoubleSide,
  });
  const leftEdgeGeometry = new THREE.BufferGeometry();
  leftEdgeGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(leftStrip, 3)
  );
  leftEdgeGeometry.setIndex(leftStripIndices);
  leftEdgeGeometry.computeVertexNormals();

  const rightEdgeGeometry = new THREE.BufferGeometry();
  rightEdgeGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(rightStrip, 3)
  );
  rightEdgeGeometry.setIndex(rightStripIndices);
  rightEdgeGeometry.computeVertexNormals();

  const leftEdgeMesh = new THREE.Mesh(leftEdgeGeometry, edgeMaterial);
  const rightEdgeMesh = new THREE.Mesh(rightEdgeGeometry, edgeMaterial);
  leftEdgeMesh.position.y = CONFIG.track.edgeYOffset;
  rightEdgeMesh.position.y = CONFIG.track.edgeYOffset;

  const tail = buildTrackTail(
    points[points.length - 1],
    getTrackTangent({ points }, 1),
    halfWidth,
    tailLength,
    material,
    edgeMaterial
  );

  return {
    mesh,
    leftEdgeMesh,
    rightEdgeMesh,
    tailMesh: tail.mesh,
    tailLeftEdge: tail.leftEdge,
    tailRightEdge: tail.rightEdge,
    points,
    distances,
    total,
    halfWidth,
    length,
    tailLength,
  };
}


function buildCar(vehicleType, color) {
  const type = vehicleType || "kart";
  const col  = new THREE.Color(color || 0xff4d4d);

  // ── Shared material palette ──
  const bodyMat  = new THREE.MeshStandardMaterial({ color: col, roughness: 0.3, metalness: 0.3 });
  const darkMat  = new THREE.MeshStandardMaterial({ color: 0x0e0e0e, roughness: 0.9 });
  const chromeMat= new THREE.MeshStandardMaterial({ color: 0xd0d0d0, roughness: 0.08, metalness: 1.0 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x99ddff, transparent: true, opacity: 0.35, roughness: 0.0, metalness: 0.5 });
  const darkBody = new THREE.MeshStandardMaterial({ color: col.clone().multiplyScalar(0.42), roughness: 0.55 });
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xffffcc, emissive: 0xffffaa, emissiveIntensity: 1.4, roughness: 0.15 });
  const redLightMat = new THREE.MeshStandardMaterial({ color: 0xff2200, emissive: 0xff1100, emissiveIntensity: 1.2, roughness: 0.15 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });

  const group  = new THREE.Group();
  const wheels = [];
  let wheelRadius = 0.5;

  function addWheel(x, y, z, r, wide = 0.54) {
    const tireGeo = new THREE.CylinderGeometry(r, r, wide, 14);
    tireGeo.rotateZ(Math.PI / 2);
    const tire = new THREE.Mesh(tireGeo, darkMat);
    tire.position.set(x, y, z);
    group.add(tire);
    wheels.push(tire);
    // Outer hubcap
    const hubGeo = new THREE.CylinderGeometry(r * 0.54, r * 0.54, 0.08, 8);
    hubGeo.rotateZ(Math.PI / 2);
    const hub = new THREE.Mesh(hubGeo, chromeMat);
    hub.position.set(x < 0 ? x - wide * 0.5 : x + wide * 0.5, y, z);
    group.add(hub);
  }

  function mkBox(w, h, d, mat, px, py, pz, rx = 0, ry = 0, rz = 0) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(px, py, pz);
    if (rx) m.rotation.x = rx;
    if (ry) m.rotation.y = ry;
    if (rz) m.rotation.z = rz;
    group.add(m); return m;
  }
  function mkCyl(rt, rb, h, seg, mat, px, py, pz, rx = 0, ry = 0, rz = 0) {
    const g = new THREE.CylinderGeometry(rt, rb, h, seg);
    const m = new THREE.Mesh(g, mat);
    m.position.set(px, py, pz);
    if (rx) m.rotation.x = rx;
    if (ry) m.rotation.y = ry;
    if (rz) m.rotation.z = rz;
    group.add(m); return m;
  }
  function mkSph(r, mat, px, py, pz, sx = 1, sy = 1, sz = 1) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), mat);
    m.position.set(px, py, pz);
    m.scale.set(sx, sy, sz);
    group.add(m); return m;
  }

  if (type === "kart") {
    // ── Standard Go-Kart (Mario / Luigi) ──
    // Wide flat chassis platform
    mkBox(2.5, 0.24, 4.2, bodyMat,  0, 0.56, 0);
    // Side pods (aerodynamic)
    mkBox(0.38, 0.34, 3.4, darkBody, -1.35, 0.62,  0.0);
    mkBox(0.38, 0.34, 3.4, darkBody,  1.35, 0.62,  0.0);
    // Front nose bumper
    mkBox(2.3,  0.38, 0.7, bodyMat,   0, 0.62, 2.3);
    mkBox(2.1,  0.26, 0.28,darkBody,  0, 0.50, 2.63);
    // Front bumper chrome bar
    mkCyl(0.10, 0.10, 2.5, 8, chromeMat, 0, 0.60, 2.80,  0, 0, Math.PI/2);
    // Seat back + base
    mkBox(1.1,  0.92, 0.22, darkBody, 0, 1.08, -1.0);
    mkBox(1.1,  0.18, 0.88, darkBody, 0, 0.72, -0.6);
    // Roll hoop U-shape
    mkCyl(0.075, 0.075, 1.32, 7, chromeMat,  0,   1.68, -1.02, 0, 0, Math.PI/2);
    mkCyl(0.075, 0.075, 0.76, 7, chromeMat, -0.6, 1.30, -1.02);
    mkCyl(0.075, 0.075, 0.76, 7, chromeMat,  0.6, 1.30, -1.02);
    // Steering wheel
    const sw = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.035, 5, 12), chromeMat);
    sw.rotation.x = -0.5; sw.position.set(0, 1.06, 0.76); group.add(sw);
    mkCyl(0.03, 0.03, 0.30, 6, chromeMat, 0, 0.91, 0.60, 0.5);
    // Exhaust pipes
    mkCyl(0.07, 0.09, 1.2, 7, chromeMat, -1.18, 0.68, -0.65, 0, 0, Math.PI/2);
    mkCyl(0.07, 0.09, 1.2, 7, chromeMat,  1.18, 0.68, -0.65, 0, 0, Math.PI/2);
    // Headlights
    mkSph(0.13, lightMat,   -0.68, 0.72, 2.72);
    mkSph(0.13, lightMat,    0.68, 0.72, 2.72);
    // Taillights
    mkSph(0.11, redLightMat,-0.90, 0.68, -2.18);
    mkSph(0.11, redLightMat, 0.90, 0.68, -2.18);
    // Number plate
    mkBox(0.9, 0.36, 0.06, whiteMat, 0, 0.72, 2.66);
    wheelRadius = 0.48;
    addWheel(-1.22, 0.48,  1.52, 0.48);
    addWheel( 1.22, 0.48,  1.52, 0.48);
    addWheel(-1.22, 0.48, -1.52, 0.48);
    addWheel( 1.22, 0.48, -1.52, 0.48);
    group.scale.setScalar(0.82);

  } else if (type === "mini") {
    // ── Biddybuggy — bubble kart (Peach / Toad / Daisy) ──
    // Bubbly round body
    mkSph(1.42, bodyMat, 0, 0.88, 0, 1.12, 0.68, 1.28);
    // Glass dome cockpit
    mkSph(0.78, glassMat, 0, 1.50, -0.16, 1.0, 0.62, 0.84);
    // Front face "headlight eyes"
    mkSph(0.24, whiteMat, -0.52, 0.90, 1.66);
    mkSph(0.24, whiteMat,  0.52, 0.90, 1.66);
    mkSph(0.15, lightMat, -0.52, 0.90, 1.78);
    mkSph(0.15, lightMat,  0.52, 0.90, 1.78);
    // Front lip bumper
    mkBox(2.52, 0.18, 0.2, darkBody, 0, 0.48, 1.48, -0.18);
    // Rear tail fin
    mkBox(1.88, 0.46, 0.16, darkBody, 0, 1.26, -1.68, 0.26);
    // Side stripe decals
    mkBox(0.12, 0.52, 2.2, whiteMat, -1.44, 0.82, 0);
    mkBox(0.12, 0.52, 2.2, whiteMat,  1.44, 0.82, 0);
    // Exhausts
    mkCyl(0.08, 0.10, 0.52, 7, chromeMat, -0.5, 0.62, -1.82, Math.PI/2);
    mkCyl(0.08, 0.10, 0.52, 7, chromeMat,  0.5, 0.62, -1.82, Math.PI/2);
    // Taillights
    mkSph(0.12, redLightMat, -0.72, 0.72, -1.76);
    mkSph(0.12, redLightMat,  0.72, 0.72, -1.76);
    wheelRadius = 0.42;
    addWheel(-1.16, 0.42,  1.08, 0.42, 0.46);
    addWheel( 1.16, 0.42,  1.08, 0.42, 0.46);
    addWheel(-1.16, 0.42, -1.08, 0.42, 0.46);
    addWheel( 1.16, 0.42, -1.08, 0.42, 0.46);
    group.scale.setScalar(0.88);

  } else if (type === "buggy") {
    // ── Wild Wiggler — caterpillar kart (Yoshi / Koopa) ──
    // Head
    mkSph(1.04, bodyMat,  0, 0.82, 2.56, 0.82, 0.72, 0.88);
    // Caterpillar body segments (alternating)
    const segZ = [1.28, 0.2, -0.88, -1.82];
    const segY = [0.76, 0.80, 0.76, 0.70];
    const segS = [0.92, 0.86, 0.78, 0.70];
    segZ.forEach((z, i) => {
      const m = i % 2 === 0 ? bodyMat : darkBody;
      mkSph(0.96, m, 0, segY[i], z, 0.76, 0.62, segS[i]);
    });
    // Eyes on head
    const eyeWM = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const eyePM = new THREE.MeshStandardMaterial({ color: 0x111111 });
    mkSph(0.22, eyeWM, -0.48, 1.20, 3.18);
    mkSph(0.22, eyeWM,  0.48, 1.20, 3.18);
    mkSph(0.12, eyePM, -0.48, 1.20, 3.32);
    mkSph(0.12, eyePM,  0.48, 1.20, 3.32);
    // Antennae
    mkCyl(0.04, 0.04, 0.80, 5, darkBody, -0.44, 1.78, 2.80, 0, 0, -0.48);
    mkCyl(0.04, 0.04, 0.80, 5, darkBody,  0.44, 1.78, 2.80, 0, 0,  0.48);
    const ballM = new THREE.MeshStandardMaterial({ color: 0xffdd00, emissive: 0xffaa00, emissiveIntensity: 0.6 });
    mkSph(0.13, ballM, -0.62, 2.16, 2.60);
    mkSph(0.13, ballM,  0.62, 2.16, 2.60);
    // Cockpit seat area
    mkBox(0.88, 0.24, 0.72, new THREE.MeshStandardMaterial({ color: 0x222222 }), 0, 1.22, 1.1);
    // Taillights / back face
    mkSph(0.12, redLightMat, -0.46, 0.72, -2.40);
    mkSph(0.12, redLightMat,  0.46, 0.72, -2.40);
    wheelRadius = 0.55;
    addWheel(-1.32, 0.55,  1.4, 0.55, 0.58);
    addWheel( 1.32, 0.55,  1.4, 0.55, 0.58);
    addWheel(-1.32, 0.55, -0.8, 0.55, 0.58);
    addWheel( 1.32, 0.55, -0.8, 0.55, 0.58);
    group.scale.setScalar(0.76);

  } else if (type === "dragster") {
    // ── Pipe Frame dragster (Wario) ──
    const pipeM = new THREE.MeshStandardMaterial({ color: col, roughness: 0.2, metalness: 0.85 });
    // Main spine tubes (forming an H-frame)
    const spineGeo = new THREE.CylinderGeometry(0.10, 0.10, 5.8, 8);
    spineGeo.rotateX(Math.PI / 2);
    const spineL = new THREE.Mesh(spineGeo, pipeM); spineL.position.set(-0.72, 0.72, 0); group.add(spineL);
    const spineR = new THREE.Mesh(spineGeo, pipeM); spineR.position.set( 0.72, 0.72, 0); group.add(spineR);
    // Cross bars
    mkCyl(0.09, 0.09, 1.46, 8, pipeM,  0, 0.72,  1.80, 0, 0, Math.PI/2);
    mkCyl(0.09, 0.09, 1.46, 8, pipeM,  0, 0.72,  0.20, 0, 0, Math.PI/2);
    mkCyl(0.09, 0.09, 1.46, 8, pipeM,  0, 0.72, -1.60, 0, 0, Math.PI/2);
    // Seat + cockpit area
    mkBox(0.96, 0.20, 0.96, new THREE.MeshStandardMaterial({ color: 0x1a1a1a }), 0, 0.92, 0.1);
    mkBox(0.88, 0.84, 0.20, darkBody, 0, 1.28, -0.42);
    // Steering wheel
    const sw2 = new THREE.Mesh(new THREE.TorusGeometry(0.20, 0.034, 5, 10), chromeMat);
    sw2.rotation.x = -0.5; sw2.position.set(0, 1.10, 0.66); group.add(sw2);
    // Engine block (rear)
    mkBox(1.44, 0.80, 1.20, darkBody, 0, 1.12, -2.0);
    // Engine exhausts (upright pipes)
    mkCyl(0.08, 0.10, 1.40, 7, chromeMat, -0.52, 1.82, -1.92);
    mkCyl(0.08, 0.10, 1.40, 7, chromeMat,  0.52, 1.82, -1.92);
    // Nose cone (front)
    const noseG = new THREE.CylinderGeometry(0.06, 0.52, 1.6, 8); noseG.rotateX(Math.PI / 2);
    const nose = new THREE.Mesh(noseG, pipeM); nose.position.set(0, 0.68, 3.5); group.add(nose);
    // Headlights
    mkSph(0.13, lightMat, -0.36, 0.72, 3.18);
    mkSph(0.13, lightMat,  0.36, 0.72, 3.18);
    wheelRadius = 0.42;
    addWheel(-0.96, 0.42,  2.0, 0.38, 0.42);  // small front
    addWheel( 0.96, 0.42,  2.0, 0.38, 0.42);
    addWheel(-1.18, 0.72, -1.9, 0.72, 0.68);  // big rear
    addWheel( 1.18, 0.72, -1.9, 0.72, 0.68);
    group.scale.setScalar(0.76);

  } else if (type === "monster") {
    // ── Standard ATV / Heavy 4x4 (Bowser) ──
    // Chassis platform
    mkBox(3.0, 0.32, 4.4, bodyMat, 0, 1.62, 0);
    // Main cab body
    mkBox(2.8, 1.10, 3.2, bodyMat, 0, 2.18, -0.2);
    // Glass windshield
    mkBox(2.5, 0.72, 0.12, glassMat, 0, 2.72, 1.46, -0.36);
    // Rear glass
    mkBox(2.5, 0.60, 0.12, glassMat, 0, 2.62, -1.72, 0.28);
    // Hood (sloped)
    mkBox(2.6, 0.30, 1.48, bodyMat, 0, 2.72, 1.24, 0.18);
    // Front crash bar / bull bar
    mkCyl(0.12, 0.12, 3.2, 8, chromeMat, 0, 1.72, 2.38, 0, 0, Math.PI/2);
    mkCyl(0.12, 0.12, 1.38, 8, chromeMat, -1.22, 2.08, 2.24, 0.48);
    mkCyl(0.12, 0.12, 1.38, 8, chromeMat,  1.22, 2.08, 2.24, 0.48);
    // Roll cage
    mkCyl(0.10, 0.10, 2.8, 8, chromeMat, -1.22, 3.2, 0, 0, 0, Math.PI/2);
    mkCyl(0.10, 0.10, 1.6, 8, chromeMat, -1.22, 2.58, -1.72);
    mkCyl(0.10, 0.10, 1.6, 8, chromeMat,  1.22, 2.58, -1.72);
    // Exhausts (dual side)
    mkCyl(0.12, 0.14, 1.6, 7, chromeMat, -1.42, 2.2, -0.8, 0, 0, Math.PI/2);
    mkCyl(0.12, 0.14, 1.6, 7, chromeMat,  1.42, 2.2, -0.8, 0, 0, Math.PI/2);
    // Headlights
    mkSph(0.18, lightMat, -0.88, 2.08, 2.52);
    mkSph(0.18, lightMat,  0.88, 2.08, 2.52);
    // Taillights
    mkSph(0.15, redLightMat, -0.88, 2.0, -2.48);
    mkSph(0.15, redLightMat,  0.88, 2.0, -2.48);
    wheelRadius = 1.08;
    addWheel(-1.74, 1.08, 1.6, 1.08, 0.82);
    addWheel( 1.74, 1.08, 1.6, 1.08, 0.82);
    addWheel(-1.74, 1.08, -1.6, 1.08, 0.82);
    addWheel( 1.74, 1.08, -1.6, 1.08, 0.82);
    group.scale.setScalar(0.60);

  } else if (type === "sports") {
    // ── Blue Falcon / Pipe Frame sports (Rosalina) ──
    // Low swept body shell
    mkSph(1.6, bodyMat, 0, 0.96, 0, 1.74, 0.56, 1.94);
    // Cabin glass
    mkSph(0.88, glassMat, 0, 1.44, -0.5, 1.02, 0.62, 0.90);
    // Front splitter nose
    mkBox(2.4, 0.14, 1.0, darkBody, 0, 0.60, 2.56);
    mkBox(2.2, 0.10, 0.44, darkBody, 0, 0.46, 3.1);
    // Rear diffuser
    mkBox(2.4, 0.14, 0.88, darkBody, 0, 0.56, -2.4, 0.18);
    // Rear spoiler blade
    mkBox(2.6, 0.08, 0.58, bodyMat, 0, 1.68, -2.28);
    mkCyl(0.06, 0.06, 0.96, 6, chromeMat, -0.96, 1.28, -2.28);
    mkCyl(0.06, 0.06, 0.96, 6, chromeMat,  0.96, 1.28, -2.28);
    // Side skirts
    mkBox(0.14, 0.36, 4.0, darkBody, -1.62, 0.64, 0);
    mkBox(0.14, 0.36, 4.0, darkBody,  1.62, 0.64, 0);
    // Dual exhaust
    mkCyl(0.09, 0.11, 0.56, 7, chromeMat, -0.56, 0.66, -2.78, Math.PI/2);
    mkCyl(0.09, 0.11, 0.56, 7, chromeMat,  0.56, 0.66, -2.78, Math.PI/2);
    // Headlights
    mkSph(0.14, lightMat, -0.82, 0.86, 2.88);
    mkSph(0.14, lightMat,  0.82, 0.86, 2.88);
    // Taillights (horizontal bar style)
    mkBox(2.2, 0.12, 0.08, redLightMat, 0, 1.06, -2.76);
    wheelRadius = 0.46;
    addWheel(-1.42, 0.46,  1.68, 0.46);
    addWheel( 1.42, 0.46,  1.68, 0.46);
    addWheel(-1.42, 0.46, -1.76, 0.46);
    addWheel( 1.42, 0.46, -1.76, 0.46);
    group.scale.setScalar(0.74);

  } else if (type === "f1") {
    // ── Circuit Special — F1 kart (DK / Waluigi) ──
    // Central monocoque
    mkBox(1.52, 0.48, 4.6, bodyMat, 0, 0.68, 0);
    // Nose cone (tapered)
    const noseGeo = new THREE.CylinderGeometry(0.24, 0.62, 1.8, 8); noseGeo.rotateX(Math.PI / 2);
    const noseM = new THREE.Mesh(noseGeo, bodyMat); noseM.position.set(0, 0.58, 3.1); group.add(noseM);
    // Front wing
    mkBox(3.4, 0.07, 0.64, bodyMat, 0, 0.32, 3.6);
    mkBox(3.2, 0.07, 0.42, darkBody, 0, 0.24, 3.84);
    // Wing end plates
    mkBox(0.08, 0.38, 0.66, darkBody, -1.68, 0.40, 3.62);
    mkBox(0.08, 0.38, 0.66, darkBody,  1.68, 0.40, 3.62);
    // Cockpit surround + halo
    mkBox(1.48, 0.56, 1.12, darkBody, 0, 1.10,  0.12);
    mkBox(1.22, 0.12, 1.12, glassMat, 0, 1.28,  0.12);
    const haloGeo = new THREE.TorusGeometry(0.54, 0.055, 5, 18, Math.PI);
    const halo = new THREE.Mesh(haloGeo, chromeMat);
    halo.rotation.z = Math.PI; halo.position.set(0, 1.54, 0.12); group.add(halo);
    // Sidepods
    mkBox(0.52, 0.84, 2.4, bodyMat, -1.04, 0.84, -0.2);
    mkBox(0.52, 0.84, 2.4, bodyMat,  1.04, 0.84, -0.2);
    // Rear wing + stands
    mkBox(2.8, 0.07, 0.58, bodyMat, 0, 1.72, -2.18);
    mkBox(2.4, 0.07, 0.48, bodyMat, 0, 1.38, -2.18);
    mkCyl(0.06, 0.06, 1.0, 6, chromeMat, -0.8, 1.22, -2.18);
    mkCyl(0.06, 0.06, 1.0, 6, chromeMat,  0.8, 1.22, -2.18);
    // Exhausts
    mkCyl(0.09, 0.12, 0.7, 7, chromeMat, -0.44, 1.12, -2.6, Math.PI/2);
    mkCyl(0.09, 0.12, 0.7, 7, chromeMat,  0.44, 1.12, -2.6, Math.PI/2);
    // Headlights
    mkSph(0.12, lightMat, -0.52, 0.62, 3.78);
    mkSph(0.12, lightMat,  0.52, 0.62, 3.78);
    wheelRadius = 0.42;
    addWheel(-1.44, 0.42,  2.0, 0.42, 0.62);  // big front
    addWheel( 1.44, 0.42,  2.0, 0.42, 0.62);
    addWheel(-1.18, 0.50, -1.7, 0.50, 0.72);  // bigger rear
    addWheel( 1.18, 0.50, -1.7, 0.50, 0.72);
    group.scale.setScalar(0.72);

  } else {
    // ── Default fallback go-kart ──
    mkBox(2.4, 0.22, 4.0, bodyMat, 0, 0.58, 0);
    mkBox(2.2, 0.36, 0.64, bodyMat, 0, 0.64, 2.2);
    mkBox(1.0, 0.88, 0.20, darkBody, 0, 1.08, -0.9);
    mkBox(1.0, 0.18, 0.86, darkBody, 0, 0.74, -0.52);
    const sw3 = new THREE.Mesh(new THREE.TorusGeometry(0.20, 0.04, 5, 12), chromeMat);
    sw3.rotation.x = -0.5; sw3.position.set(0, 1.06, 0.70); group.add(sw3);
    wheelRadius = 0.46;
    addWheel(-1.18, 0.46,  1.5, 0.46);
    addWheel( 1.18, 0.46,  1.5, 0.46);
    addWheel(-1.18, 0.46, -1.5, 0.46);
    addWheel( 1.18, 0.46, -1.5, 0.46);
    group.scale.setScalar(0.84);
  }

  group.traverse((c) => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = false; } });
  // Return EMPTY bodyMaterials — character kart colors are baked in and must not be overridden
  return { root: group, wheels, wheelRadius, bodyMaterials: [] };
}

function loadCarModel(parent, fallbackRoot, characterId) {
  // Use procedural vehicles — no GLB loading needed
  const character = CONFIG.characters.find((c) => c.id === characterId) || CONFIG.characters[0];
  const result = buildCar(character.vehicle, character.color);

  parent.remove(fallbackRoot);
  disposeObject3D(fallbackRoot);
  parent.add(result.root);

  parent.userData.wheels = result.wheels;
  parent.userData.wheelRadius = result.wheelRadius;
  parent.userData.model = result.root;
  parent.userData.bodyMaterials = result.bodyMaterials;
  parent.userData.procedural = true;
  // Character kart colors are baked in — no applyCarColor needed
}

/* Rock/tree models are now preloaded and cached — see preloadModels() above */

function applyTreesToObjects(treesList, sources) {
  treesList.forEach((tree) => {
    const source = sources[Math.floor(Math.random() * sources.length)];
    const model = source.clone(true);
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const target = tree.targetSize;
    const scale = Math.min(
      target.width / Math.max(0.01, size.x),
      target.height / Math.max(0.01, size.y),
      target.depth / Math.max(0.01, size.z)
    );

    model.scale.setScalar(scale);
    const scaledBounds = new THREE.Box3().setFromObject(model);
    const center = scaledBounds.getCenter(new THREE.Vector3());
    model.position.x -= center.x;
    model.position.z -= center.z;
    model.position.y -= scaledBounds.min.y;
    model.rotation.y = Math.random() * Math.PI * 2;

    if (tree.placeholder) {
      tree.mesh.remove(tree.placeholder);
    }
    tree.mesh.add(model);
  });
}

function applyRockToObstacles(obstaclesList, sources) {
  obstaclesList.forEach((obstacle) => {
    const source = sources[Math.floor(Math.random() * sources.length)];
    const rock = source.clone(true);
    const bounds = new THREE.Box3().setFromObject(rock);
    const size = bounds.getSize(new THREE.Vector3());
    const target = obstacle.targetSize;
    const scale = Math.min(
      target.width / Math.max(0.01, size.x),
      target.height / Math.max(0.01, size.y),
      target.depth / Math.max(0.01, size.z)
    );

    rock.scale.setScalar(scale);
    const scaledBounds = new THREE.Box3().setFromObject(rock);
    const center = scaledBounds.getCenter(new THREE.Vector3());
    rock.position.x -= center.x;
    rock.position.z -= center.z;
    rock.position.y -= scaledBounds.min.y;
    rock.rotation.y = Math.random() * Math.PI * 2;

    if (obstacle.placeholder) {
      obstacle.mesh.remove(obstacle.placeholder);
    }
    obstacle.mesh.add(rock);
  });
}


function applyCarColor(color) {
  if (car?.userData?.bodyMaterials?.length) {
    car.userData.bodyMaterials.forEach((material) => {
      if (material?.color) material.color.copy(color);
    });
  }

  // For GLB models (non-procedural), also traverse children
  if (car?.userData?.model && !car?.userData?.procedural) {
    applyColorToModel(car.userData.model, color);
  }
}

function applyColorToModel(model, color) {
  const isBrightWhite = color.r > 0.95 && color.g > 0.95 && color.b > 0.95;
  model.traverse((child) => {
    if (!child.isMesh) return;
    if (/wheel|tire|tyre/i.test(child.name)) return;

    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => {
      if (!material?.color) return;
      if (material.transparent && material.opacity < 0.9) return;
      if (/glass|window/i.test(material.name || "")) return;
      if (isBrightWhite) {
        if (material.map && !material.userData?.originalMap) {
          material.userData = { ...(material.userData || {}), originalMap: material.map };
        }
        material.map = null;
      } else if (material.userData?.originalMap) {
        material.map = material.userData.originalMap;
      }
      material.color.copy(color);
      material.needsUpdate = true;
    });
  });
}

function buildTrackTail(endPoint, tangent, halfWidth, tailLength, roadMaterial, edgeMaterial) {
  const yaw = Math.atan2(tangent.x, tangent.z);
  const center = endPoint.clone().addScaledVector(tangent, tailLength * 0.5);

  // Use BoxGeometry (thin slab) inside a Group so yaw rotation is clean.
  // PlaneGeometry + dual Euler rotation causes skewed faces when the track curves.
  const slabThickness = 0.15;
  const tailMesh = new THREE.Mesh(
    new THREE.BoxGeometry(halfWidth * 2, slabThickness, tailLength),
    roadMaterial
  );
  tailMesh.position.y = slabThickness * 0.5;

  const tailGroup = new THREE.Group();
  tailGroup.rotation.y = yaw;
  tailGroup.position.copy(center);
  tailGroup.position.y = CONFIG.track.trackYOffset - slabThickness * 0.5;
  tailGroup.add(tailMesh);

  const edgeWidth = CONFIG.track.edgeOffset;
  const leftEdge = new THREE.Mesh(new THREE.BoxGeometry(edgeWidth, 0.1, tailLength), edgeMaterial);
  const rightEdge = new THREE.Mesh(new THREE.BoxGeometry(edgeWidth, 0.1, tailLength), edgeMaterial);

  leftEdge.position.set(halfWidth + edgeWidth * 0.5, 0.05, 0);
  rightEdge.position.set(-(halfWidth + edgeWidth * 0.5), 0.05, 0);
  tailGroup.add(leftEdge, rightEdge);

  // Return the group as both the main "mesh" and the edge references
  // so initLevel / clearLevelScene can simply add/remove tailGroup.
  return { mesh: tailGroup, leftEdge: null, rightEdge: null };
}

function createTrackTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#2a2d35";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#1f2229";
  for (let i = 0; i < 120; i += 1) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const size = 2 + Math.random() * 3;
    ctx.fillRect(x, y, size, size);
  }

  ctx.fillStyle = "#f3f3f3";
  const stripeWidth = 10;
  ctx.fillRect(10, 0, stripeWidth, canvas.height);
  ctx.fillRect(canvas.width - 10 - stripeWidth, 0, stripeWidth, canvas.height);

  ctx.fillStyle = "#ffd36b";
  for (let y = 0; y < canvas.height; y += 40) {
    ctx.fillRect(canvas.width / 2 - 6, y, 12, 18);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 18);
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

function applyLevel(levelKey) {
  const level = getLevelConfig(levelKey);
  if (!level) return;
  state.levelKey = level.key;
  if (ground?.material?.color) {
    ground.material.color.set(level.groundColor);
  }
  // T6: Sky color per world
  const skyColor = level.skyColor ?? CONFIG.colors.sky;
  scene.background = new THREE.Color(skyColor);
  sky.material.color.set(skyColor);
  if (hudLevel) {
    const idx = (CONFIG.levels ?? []).findIndex((l) => l.key === level.key);
    const total = (CONFIG.levels ?? []).length;
    const icon = WORLD_ICONS[level.world] ?? "";
    hudLevel.textContent = `${icon} Nivel ${idx + 1}/${total} — ${level.label}`;
  }
  updateLevelMenuState();
  initLevel(level.key);
}

function buildCheckpoints(trackData) {
  const gates = [];
  for (let i = 0; i < state.checkpoints.length; i += 1) {
    const t = state.checkpoints[i];
    const gate = buildCheckpointGate(trackData, t);
    gates.push(gate);
  }
  return gates;
}

function buildCheckpointGate(trackData, t) {
  const group = new THREE.Group();
  const stripWidth = trackData.halfWidth * 2 + 2.0;

  // Flat ground strip — chevron / dashed pattern
  const canvas = document.createElement("canvas");
  canvas.width = 256; canvas.height = 64;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const stripeW = 32;
  for (let x = 0; x < canvas.width; x += stripeW * 2) {
    ctx.fillStyle = "#ffcc00";
    ctx.fillRect(x, 0, stripeW, canvas.height);
  }
  ctx.fillStyle = "#111111";
  ctx.font = "bold 28px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("CHECK", canvas.width / 2, canvas.height / 2);

  const tex = new THREE.CanvasTexture(canvas);
  const bannerMaterial = new THREE.MeshStandardMaterial({
    map: tex,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(stripWidth, 1.8), bannerMaterial);
  strip.rotation.x = -Math.PI / 2;
  strip.position.set(0, 0.04, 0);
  group.add(strip);

  // Small side pylons (0.5 u tall — below car height)
  const pylonMat = new THREE.MeshStandardMaterial({ color: 0xffcc00 });
  const pylonH = 0.5;
  const pOff = trackData.halfWidth + 0.6;
  const lp = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, pylonH, 6), pylonMat);
  const rp = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, pylonH, 6), pylonMat);
  lp.position.set(-pOff, pylonH / 2, 0);
  rp.position.set(pOff, pylonH / 2, 0);
  group.add(lp, rp);

  const pos = getTrackPoint(trackData, t);
  const tangent = getTrackTangent(trackData, t);
  group.position.copy(pos);
  group.position.y = 0.2;
  group.rotation.y = Math.atan2(tangent.x, tangent.z);

  group.userData = { banner: strip, label: strip, postMaterial: pylonMat, bannerMaterial, kind: "checkpoint" };
  return group;
}

function buildFinishGate(trackData) {
  const group = new THREE.Group();
  const stripWidth = trackData.halfWidth * 2 + 2.5;

  // Checkerboard ground strip
  const canvas = document.createElement("canvas");
  canvas.width = 128; canvas.height = 128;
  const ctx = canvas.getContext("2d");
  const cellSize = 16;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      ctx.fillStyle = (row + col) % 2 === 0 ? "#ffffff" : "#111111";
      ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
    }
  }
  const bannerMaterial = new THREE.MeshStandardMaterial({
    map: new THREE.CanvasTexture(canvas),
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(stripWidth, 2.8), bannerMaterial);
  strip.rotation.x = -Math.PI / 2;
  strip.position.set(0, 0.04, 0);
  group.add(strip);

  // "FINISH" text overlay on ground
  const labelCanvas = document.createElement("canvas");
  labelCanvas.width = 512; labelCanvas.height = 64;
  const lCtx = labelCanvas.getContext("2d");
  lCtx.clearRect(0, 0, labelCanvas.width, labelCanvas.height);
  lCtx.fillStyle = "#ffffff";
  lCtx.font = "bold 48px sans-serif";
  lCtx.textAlign = "center";
  lCtx.textBaseline = "middle";
  lCtx.fillText("🏁 FINISH", labelCanvas.width / 2, labelCanvas.height / 2);
  const finishLabel = new THREE.Mesh(
    new THREE.PlaneGeometry(stripWidth, 1.2),
    new THREE.MeshStandardMaterial({
      map: new THREE.CanvasTexture(labelCanvas),
      transparent: true,
      polygonOffset: true,
      polygonOffsetFactor: -3,
      polygonOffsetUnits: -3,
    })
  );
  finishLabel.rotation.x = -Math.PI / 2;
  finishLabel.position.set(0, 0.06, 0);
  group.add(finishLabel);

  // Small side bollards with checkerboard pattern
  const postMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
  const bollardH = 0.7;
  const pOff = trackData.halfWidth + 0.8;
  const lb = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, bollardH, 6), postMaterial);
  const rb = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, bollardH, 6), postMaterial);
  lb.position.set(-pOff, bollardH / 2, 0);
  rb.position.set(pOff, bollardH / 2, 0);
  group.add(lb, rb);

  const pos = getTrackPoint(trackData, 1);
  const tangent = getTrackTangent(trackData, 1);
  group.position.copy(pos);
  group.position.y = 0.2;
  group.rotation.y = Math.atan2(tangent.x, tangent.z);

  group.userData = { banner: strip, finishLabel, postMaterial, bannerMaterial, kind: "finish" };
  return group;
}

function buildStartLine(trackData) {
  const group = new THREE.Group();
  const stripWidth = trackData.halfWidth * 2 + 2.0;

  // Green/white striped ground strip
  const canvas = document.createElement("canvas");
  canvas.width = 256; canvas.height = 64;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#22cc22";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const stripeW = 32;
  for (let x = 0; x < canvas.width; x += stripeW * 2) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x, 0, stripeW, canvas.height);
  }
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 32px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("START", canvas.width / 2, canvas.height / 2);

  const strip = new THREE.Mesh(
    new THREE.PlaneGeometry(stripWidth, 1.8),
    new THREE.MeshStandardMaterial({
      map: new THREE.CanvasTexture(canvas),
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    })
  );
  strip.rotation.x = -Math.PI / 2;
  strip.position.set(0, 0.04, 0);
  group.add(strip);

  // Small green pylons on sides
  const pylonMat = new THREE.MeshStandardMaterial({ color: 0x22cc22 });
  const pylonH = 0.5;
  const pOff = trackData.halfWidth + 0.6;
  const lp = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, pylonH, 6), pylonMat);
  const rp = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, pylonH, 6), pylonMat);
  lp.position.set(-pOff, pylonH / 2, 0);
  rp.position.set(pOff, pylonH / 2, 0);
  group.add(lp, rp);

  const pos = getTrackPoint(trackData, 0);
  const tangent = getTrackTangent(trackData, 0);
  group.position.copy(pos);
  group.position.y = 0.0;
  group.rotation.y = Math.atan2(tangent.x, tangent.z);
  return group;
}

function buildObstacles(trackData, level) {
  const layout = buildObstacleLayout(level ?? {});
  return layout.map((item) => {
    const center = getTrackPoint(trackData, item.t);
    const tangent = getTrackTangent(trackData, item.t);
    const left = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

    const width = CONFIG.obstacles.size;
    const depth = CONFIG.obstacles.size;
    const height = CONFIG.obstacles.height;

    const group = new THREE.Group();
    const placeholder = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      new THREE.MeshStandardMaterial({ color: 0xff8c1a })
    );
    placeholder.position.y = height * 0.5;
    group.add(placeholder);
    group.position.copy(center).addScaledVector(left, item.lateral);

    const lateralHalf = width * 0.5;
    const progressHalf = (depth * 0.5) / trackData.total;

    return {
      mesh: group,
      placeholder,
      targetSize: { width, height, depth },
      lateralHalf,
      progressHalf,
      lateral: item.lateral,
      t: item.t,
      height,
      ramp: item.ramp === true,
    };
  });
}

function buildObstacleLayout(level) {
  if (Array.isArray(level.obstacles)) return level.obstacles;

  const count = Math.max(1, level.obstacleCount ?? CONFIG.obstacles.layout.length);
  const rampCount = Math.min(count, Math.max(0, level.rampCount ?? 0));
  const result = [];
  for (let i = 0; i < count; i += 1) {
    const t = 0.15 + (i / Math.max(1, count - 1)) * 0.7;
    const lateral = i % 2 === 0 ? -2.4 : 2.4;
    result.push({ t, lateral, ramp: i < rampCount });
  }
  return result;
}

function buildRamps(trackData, obstaclesList) {
  const rampFrontWidth = CONFIG.ramps.frontWidth;
  const rampBackWidth = CONFIG.ramps.backWidth;
  const rampLength = CONFIG.ramps.length;
  const rampHeight = CONFIG.ramps.height;
  const material = new THREE.MeshStandardMaterial({ color: CONFIG.colors.ramp, roughness: 0.95 });

  return obstaclesList
    .filter((obstacle) => obstacle.ramp)
    .map((obstacle) => {
      const rampT = Math.max(0, obstacle.t - CONFIG.ramps.offsetT);
      const center = getTrackPoint(trackData, rampT);
      const tangent = getTrackTangent(trackData, rampT);
      const left = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      const mesh = new THREE.Mesh(
        buildRampGeometry(rampFrontWidth, rampBackWidth, rampLength, rampHeight),
        material
      );
      mesh.position.copy(center).addScaledVector(left, obstacle.lateral);
      mesh.position.y = 0;
      mesh.rotation.y = Math.atan2(tangent.x, tangent.z);

      const lateralHalf = rampBackWidth * 0.5;
      const progressHalf = (rampLength * 0.5) / trackData.total;

      return {
        mesh,
        t: rampT,
        lateral: obstacle.lateral,
        lateralHalf,
        progressHalf,
        height: rampHeight,
        frontWidth: rampFrontWidth,
        backWidth: rampBackWidth,
        length: rampLength,
      };
    });
}

function buildRampGeometry(frontWidth, backWidth, length, height) {
  const halfLen = length * 0.5;
  const halfFront = frontWidth * 0.5;
  const halfBack = backWidth * 0.5;

  const vertices = new Float32Array([
    -halfFront, 0, -halfLen,
    halfFront, 0, -halfLen,
    halfBack, 0, halfLen,
    -halfBack, 0, halfLen,
    -halfFront, 0, -halfLen,
    halfFront, 0, -halfLen,
    halfBack, height, halfLen,
    -halfBack, height, halfLen,
  ]);

  const indices = [
    0, 1, 2, 0, 2, 3,
    4, 7, 6, 4, 6, 5,
    0, 4, 5, 0, 5, 1,
    1, 5, 6, 1, 6, 2,
    2, 6, 7, 2, 7, 3,
    3, 7, 4, 3, 4, 0,
  ];

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function buildTrees(trackData, level) {
  const count = level?.treeCount ?? CONFIG.trees.count;
  const trees = [];
  const baseOffset = trackData.halfWidth + CONFIG.trees.baseOffset;

  for (let i = 0; i < count; i += 1) {
    const t = 0.06 + (i / (count - 1)) * 0.88;
    const center = getTrackPoint(trackData, t);
    const tangent = getTrackTangent(trackData, t);
    const left = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const side = i % 2 === 0 ? 1 : -1;
    const jitter = (Math.sin(i * 12.7) + 1) * CONFIG.trees.jitter;
    const lateral = side * (baseOffset + jitter);

    const width = CONFIG.trees.width;
    const depth = CONFIG.trees.depth;
    const height = CONFIG.trees.height;

    const group = new THREE.Group();
    const placeholder = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.6, height, 8),
      new THREE.MeshStandardMaterial({ color: 0x2a5a2a })
    );
    placeholder.position.y = height * 0.5;
    group.add(placeholder);
    group.position.copy(center).addScaledVector(left, lateral);

    const lateralHalf = width * 0.5;
    const progressHalf = (depth * 0.5) / trackData.total;

    trees.push({
      mesh: group,
      placeholder,
      targetSize: { width, height, depth },
      lateralHalf,
      progressHalf,
      lateral,
      t,
    });
  }

  return trees;
}

function buildTurboPads(trackData, level) {
  const pads = level?.turboPads ?? [];
  const w = CONFIG.turboPads.width;
  const l = CONFIG.turboPads.length;

  // Canvas texture: cyan bg with forward arrows
  const padCanvas = document.createElement("canvas");
  padCanvas.width = 256; padCanvas.height = 256;
  const pc = padCanvas.getContext("2d");
  pc.fillStyle = "#00ffcc";
  pc.fillRect(0, 0, 256, 256);
  pc.fillStyle = "#003322";
  pc.font = "bold 60px sans-serif";
  pc.textAlign = "center";
  pc.fillText("TURBO", 128, 55);
  // Three arrows pointing forwards
  [[48, 80], [128, 80], [208, 80]].forEach(([x]) => {
    for (let row = 0; row < 3; row++) {
      const y = 100 + row * 52;
      pc.beginPath();
      pc.moveTo(x, y); pc.lineTo(x - 22, y + 32); pc.lineTo(x + 22, y + 32);
      pc.closePath();
      pc.fillStyle = `rgba(0,50,30,${0.5 + row * 0.2})`;
      pc.fill();
    }
  });
  pc.fillStyle = "#ffff00";
  pc.font = "bold 24px sans-serif";
  pc.fillText("⚡", 40, 248); pc.fillText("⚡", 128, 248); pc.fillText("⚡", 216, 248);
  const padTex = new THREE.CanvasTexture(padCanvas);

  return pads.map((item) => {
    const center = getTrackPoint(trackData, item.t);
    const tangent = getTrackTangent(trackData, item.t);
    const left = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const yaw = Math.atan2(tangent.x, tangent.z);
    const group = new THREE.Group();
    group.rotation.y = yaw;

    // Floor panel
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(w, 0.14, l),
      new THREE.MeshStandardMaterial({
        map: padTex, color: 0x00ffcc,
        emissive: 0x00ffcc, emissiveIntensity: 0.45,
        roughness: 0.3,
        polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
      })
    );
    floor.position.y = 0.07;
    group.add(floor);

    // Side glow pillar columns
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x00ffcc, emissive: 0x00ffcc, emissiveIntensity: 1.4 });
    [[-w * 0.5 - 0.3, l * 0.5 - 0.5], [-w * 0.5 - 0.3, -l * 0.5 + 0.5],
     [ w * 0.5 + 0.3, l * 0.5 - 0.5], [ w * 0.5 + 0.3, -l * 0.5 + 0.5]].forEach(([px, pz]) => {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.8, 8), pillarMat);
      pillar.position.set(px, 0.9, pz);
      group.add(pillar);
      const top = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), pillarMat);
      top.position.set(px, 1.9, pz);
      group.add(top);
    });

    group.position.copy(center).addScaledVector(left, item.lateral ?? 0);
    group.position.y = CONFIG.track.trackYOffset;

    const lateralHalf = w * 0.5;
    const progressHalf = (l * 0.5) / trackData.total;
    return { mesh: group, t: item.t, lateral: item.lateral ?? 0, lateralHalf, progressHalf };
  });
}

function buildTrampolines(trackData, level) {
  const tramps = level?.trampolines ?? [];
  const w = CONFIG.trampolines.width;
  const l = CONFIG.trampolines.length;

  return tramps.map((item) => {
    const center = getTrackPoint(trackData, item.t);
    const tangent = getTrackTangent(trackData, item.t);
    const left = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const yaw = Math.atan2(tangent.x, tangent.z);
    const group = new THREE.Group();
    group.rotation.y = yaw;

    // Steel frame (4 bars)
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.5, metalness: 0.8 });
    const sideX = new THREE.Mesh(new THREE.BoxGeometry(w + 0.6, 0.35, 0.4), frameMat);
    sideX.position.set(0, 0.85, l * 0.5);
    group.add(sideX);
    const sideX2 = sideX.clone(); sideX2.position.z = -l * 0.5; group.add(sideX2);
    const sideZ = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, l), frameMat);
    sideZ.position.set(w * 0.5, 0.85, 0); group.add(sideZ);
    const sideZ2 = sideZ.clone(); sideZ2.position.x = -w * 0.5; group.add(sideZ2);

    // Spring legs at 4 corners
    const springMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.9 });
    [[-w*0.5, l*0.5], [w*0.5, l*0.5], [-w*0.5, -l*0.5], [w*0.5, -l*0.5]].forEach(([sx, sz]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.28, 0.85, 10), springMat);
      leg.position.set(sx, 0.425, sz);
      group.add(leg);
    });

    // Rubber mat (canvas: orange with "BOING!" text)
    const matCanvas = document.createElement("canvas");
    matCanvas.width = 256; matCanvas.height = 256;
    const mc = matCanvas.getContext("2d");
    mc.fillStyle = "#ff7700";
    mc.fillRect(0, 0, 256, 256);
    // Cross lines
    mc.strokeStyle = "#cc5500"; mc.lineWidth = 6;
    mc.beginPath(); mc.moveTo(0, 128); mc.lineTo(256, 128); mc.stroke();
    mc.beginPath(); mc.moveTo(128, 0); mc.lineTo(128, 256); mc.stroke();
    mc.fillStyle = "#ffffff";
    mc.font = "bold 48px sans-serif"; mc.textAlign = "center"; mc.textBaseline = "middle";
    mc.fillText("BOING!", 128, 128);
    const rubber = new THREE.Mesh(
      new THREE.BoxGeometry(w - 0.5, 0.12, l - 0.5),
      new THREE.MeshStandardMaterial({
        map: new THREE.CanvasTexture(matCanvas),
        roughness: 0.7, emissive: 0xff7700, emissiveIntensity: 0.3,
        polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
      })
    );
    rubber.position.y = 0.86 + 0.06;
    group.add(rubber);

    group.position.copy(center).addScaledVector(left, item.lateral ?? 0);
    group.position.y = 0.0;

    const lateralHalf = w * 0.5;
    const progressHalf = (l * 0.5) / trackData.total;
    return { mesh: group, t: item.t, lateral: item.lateral ?? 0, lateralHalf, progressHalf, launched: false };
  });
}

function buildLavaZones(trackData, level) {
  const zones = level?.lavaZones ?? [];
  const w = CONFIG.lava.width;
  const l = CONFIG.lava.length;

  // Lava canvas texture
  const lavaCanvas = document.createElement("canvas");
  lavaCanvas.width = 256; lavaCanvas.height = 256;
  const lc = lavaCanvas.getContext("2d");
  lc.fillStyle = "#330000";
  lc.fillRect(0, 0, 256, 256);
  // Lava blobs
  const blobs = [[60,60,45],[180,50,38],[40,160,35],[190,170,42],[120,120,55],[90,200,30],[200,130,28]];
  blobs.forEach(([bx, by, br]) => {
    const grad = lc.createRadialGradient(bx, by, 0, bx, by, br);
    grad.addColorStop(0, "#ffaa00"); grad.addColorStop(0.4, "#ff4400"); grad.addColorStop(1, "#660000");
    lc.beginPath(); lc.arc(bx, by, br, 0, Math.PI * 2);
    lc.fillStyle = grad; lc.fill();
  });
  // Warning text
  lc.fillStyle = "#ffff00"; lc.font = "bold 38px sans-serif"; lc.textAlign = "center"; lc.textBaseline = "middle";
  lc.fillText("☠ LAVA ☠", 128, 128);
  const lavaTex = new THREE.CanvasTexture(lavaCanvas);

  return zones.map((item) => {
    const center = getTrackPoint(trackData, item.t);
    const tangent = getTrackTangent(trackData, item.t);
    const left = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const yaw = Math.atan2(tangent.x, tangent.z);
    const group = new THREE.Group();
    group.rotation.y = yaw;

    // Lava floor slab
    const slab = new THREE.Mesh(
      new THREE.BoxGeometry(w, 0.28, l),
      new THREE.MeshStandardMaterial({
        map: lavaTex,
        color: 0xff2200, emissive: 0xff2200, emissiveIntensity: 0.85,
        roughness: 0.6,
        polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
      })
    );
    slab.position.y = 0.14;
    group.add(slab);

    // Lava bubbles
    const bubbleMat = new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff3300, emissiveIntensity: 1.1 });
    [[-w*0.28, 0.55, -l*0.25], [w*0.22, 0.48, l*0.2], [0, 0.52, 0],
     [-w*0.1, 0.44, l*0.3], [w*0.15, 0.5, -l*0.35]].forEach(([bx, by, bz]) => {
      const bubble = new THREE.Mesh(new THREE.SphereGeometry(0.38, 8, 6), bubbleMat);
      bubble.position.set(bx, by, bz);
      group.add(bubble);
    });

    // Warning signs at edges
    const signMat = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xaaaa00, emissiveIntensity: 0.6 });
    [[-w * 0.55, 0, 0], [w * 0.55, 0, 0]].forEach(([sx, sy, sz]) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.2, 6), new THREE.MeshStandardMaterial({ color: 0x555555 }));
      pole.position.set(sx, 1.1, sz); group.add(pole);
      const sign = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.1), signMat);
      sign.position.set(sx, 2.3, sz); group.add(sign);
    });

    group.position.copy(center).addScaledVector(left, item.lateral ?? 0);
    group.position.y = 0.0;

    const lateralHalf = w * 0.5;
    const progressHalf = (l * 0.5) / trackData.total;
    return { mesh: group, t: item.t, lateral: item.lateral ?? 0, lateralHalf, progressHalf };
  });
}

function buildMudZones(trackData, level) {
  const zones = level?.mudZones ?? [];
  const w = CONFIG.mud.width;
  const l = CONFIG.mud.length;

  // Mud canvas texture
  const mudCanvas = document.createElement("canvas");
  mudCanvas.width = 256; mudCanvas.height = 256;
  const mcc = mudCanvas.getContext("2d");
  mcc.fillStyle = "#3d2408";
  mcc.fillRect(0, 0, 256, 256);
  // Mud puddle blobs
  [[90,80,48],[170,60,35],[50,180,42],[200,180,38],[130,150,55],[80,130,28]].forEach(([bx, by, br]) => {
    const grad = mcc.createRadialGradient(bx, by, 0, bx, by, br);
    grad.addColorStop(0, "#6b4010"); grad.addColorStop(0.5, "#4a2c08"); grad.addColorStop(1, "#2a1400");
    mcc.beginPath(); mcc.arc(bx, by, br, 0, Math.PI * 2);
    mcc.fillStyle = grad; mcc.fill();
  });
  // Tire tracks
  mcc.strokeStyle = "#1a0c00"; mcc.lineWidth = 8;
  mcc.beginPath(); mcc.moveTo(80, 0); mcc.lineTo(88, 256); mcc.stroke();
  mcc.beginPath(); mcc.moveTo(168, 0); mcc.lineTo(176, 256); mcc.stroke();
  mcc.fillStyle = "#8b5c20"; mcc.font = "bold 34px sans-serif"; mcc.textAlign = "center"; mcc.textBaseline = "middle";
  mcc.fillText("BARRO", 128, 128);
  const mudTex = new THREE.CanvasTexture(mudCanvas);

  return zones.map((item) => {
    const center = getTrackPoint(trackData, item.t);
    const tangent = getTrackTangent(trackData, item.t);
    const left = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const yaw = Math.atan2(tangent.x, tangent.z);
    const group = new THREE.Group();
    group.rotation.y = yaw;

    // Mud slab (slightly recessed)
    const slab = new THREE.Mesh(
      new THREE.BoxGeometry(w, 0.18, l),
      new THREE.MeshStandardMaterial({
        map: mudTex,
        roughness: 1.0,
        polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
      })
    );
    slab.position.y = 0.09;
    group.add(slab);

    // Mud clumps / bumps
    const clumpMat = new THREE.MeshStandardMaterial({ color: 0x5c3d1e, roughness: 1.0 });
    [[-w*0.22, 0.32, l*0.2], [w*0.18, 0.28, -l*0.25], [0, 0.3, l*0.05],
     [-w*0.1, 0.25, -l*0.15], [w*0.28, 0.3, l*0.35]].forEach(([cx, cy, cz]) => {
      const clump = new THREE.Mesh(new THREE.SphereGeometry(0.32, 7, 5), clumpMat);
      clump.scale.y = 0.55;
      clump.position.set(cx, cy, cz);
      group.add(clump);
    });

    // Warning sign
    const signPostMat = new THREE.MeshStandardMaterial({ color: 0x886633 });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.4, 6), signPostMat);
    pole.position.set(w * 0.6, 1.2, 0); group.add(pole);
    const signBoard = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 0.9, 0.12),
      new THREE.MeshStandardMaterial({ color: 0xffcc00 })
    );
    signBoard.position.set(w * 0.6, 2.6, 0); group.add(signBoard);

    group.position.copy(center).addScaledVector(left, item.lateral ?? 0);
    group.position.y = 0.0;

    const lateralHalf = w * 0.5;
    const progressHalf = (l * 0.5) / trackData.total;
    return { mesh: group, t: item.t, lateral: item.lateral ?? 0, lateralHalf, progressHalf };
  });
}

function buildCollectible(trackData, level) {
  if (!level?.collectible) return null;
  const { t, lateral } = level.collectible;

  const group = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.OctahedronGeometry(1.0, 0),
    new THREE.MeshStandardMaterial({
      color: 0xffdd00,
      emissive: 0xffaa00,
      emissiveIntensity: 0.9,
      roughness: 0.3,
      metalness: 0.5,
    })
  );
  body.scale.set(1.2, 0.6, 1.2);
  group.add(body);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.4, 0.18, 8, 24),
    new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      emissive: 0xff8800,
      emissiveIntensity: 0.7,
      roughness: 0.4,
      metalness: 0.3,
    })
  );
  group.add(ring);

  const center = getTrackPoint(trackData, t);
  const tangent = getTrackTangent(trackData, t);
  const left = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
  group.position.copy(center).addScaledVector(left, lateral);
  group.position.y = CONFIG.collectible.height;
  group.userData.baseY = CONFIG.collectible.height;

  const lateralHalf = 1.8;
  const progressHalf = 3.0 / trackData.total;
  return { mesh: group, t, lateral, lateralHalf, progressHalf, collected: false };
}

function animateCollectible(delta) {
  if (!collectible || collectible.collected) {
    if (collectible?.collected) collectible.mesh.visible = false;
    return;
  }
  const elapsed = clock.elapsedTime;
  collectible.mesh.rotation.y += CONFIG.collectible.rotateSpeed * delta;
  collectible.mesh.position.y =
    (collectible.mesh.userData.baseY ?? CONFIG.collectible.height) + Math.sin(elapsed * 2.8) * 0.5;
}

function getTrackPoint(trackData, t) {
  if (t <= 0) return trackData.points[0].clone();
  if (t >= 1) return trackData.points[trackData.points.length - 1].clone();

  const distance = t * trackData.total;
  // B3/T3: Binary search instead of findIndex
  const dists = trackData.distances;
  let lo = 0, hi = dists.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (dists[mid] < distance) lo = mid + 1;
    else hi = mid;
  }
  let idx = lo;
  if (idx <= 0) return trackData.points[0].clone();
  const prev = trackData.points[idx - 1];
  const next = trackData.points[idx];
  const prevDist = trackData.distances[idx - 1];
  const nextDist = trackData.distances[idx];
  const ratio = (distance - prevDist) / (nextDist - prevDist || 1);
  return new THREE.Vector3().lerpVectors(prev, next, ratio);
}

function getTrackTangent(trackData, t) {
  if (t >= 1) {
    const last = trackData.points[trackData.points.length - 1];
    const prev = trackData.points[trackData.points.length - 2];
    return last.clone().sub(prev).normalize();
  }
  if (t <= 0) {
    const first = trackData.points[0];
    const next = trackData.points[1];
    return next.clone().sub(first).normalize();
  }

  const dt = 1 / trackData.points.length;
  const p1 = getTrackPoint(trackData, Math.min(1, t + dt));
  const p0 = getTrackPoint(trackData, Math.max(0, t - dt));
  return p1.sub(p0).normalize();
}

function getTrackCurvature(trackData, t) {
  const dt = 1 / trackData.points.length;
  const t0 = Math.max(0, t - dt);
  const t1 = Math.min(1, t + dt);
  const tan0 = getTrackTangent(trackData, t0);
  const tan1 = getTrackTangent(trackData, t1);
  const yaw0 = Math.atan2(tan0.x, tan0.z);
  const yaw1 = Math.atan2(tan1.x, tan1.z);
  let delta = yaw1 - yaw0;
  if (delta > Math.PI) delta -= Math.PI * 2;
  if (delta < -Math.PI) delta += Math.PI * 2;
  return delta;
}

function updateCamera(center, tangent) {
  const behind = center.clone().addScaledVector(tangent, -12);
  behind.y += 7;
  camera.position.lerp(behind, 0.12);

  const lookAt = center.clone();
  lookAt.y += 2.5;
  camera.lookAt(lookAt);
}

function updateCheckpoints(center) {
  if (state.checkpointIndex >= state.checkpoints.length) return;
  const targetT = state.checkpoints[state.checkpointIndex];
  const target = getTrackPoint(track, targetT);
  if (center.distanceTo(target) < 5.0) {
    const gate = checkpoints[state.checkpointIndex];
    if (gate?.userData?.bannerMaterial) {
      gate.userData.bannerMaterial.color.set(0x77ff77);
    }
    state.checkpointIndex += 1;
  }
  hudCheckpoint.textContent = `${state.checkpointIndex}/${state.checkpoints.length}`;
}

function checkFinish() {
  if (state.finished) return;
  if (state.progress >= 1 && state.checkpointIndex >= state.checkpoints.length) {
    state.finished = true;
    finishTime.textContent = state.time.toFixed(2);
    finishPanel.classList.remove("hidden");
    if (finishGate?.userData?.bannerMaterial) {
      finishGate.userData.bannerMaterial.color.set(0x77ff77);
    }
    const nextLevel = getNextLevelKey();
    if (finishNext) {
      finishNext.classList.toggle("hidden", !nextLevel);
    }
    playSound("finish");
  }
}

function updateHud() {
  hudTime.textContent = state.time.toFixed(2);
  hudSpeed.textContent = Math.round(state.speed * 3.6);
  if (hudCollectible) hudCollectible.textContent = state.collectibleCollected ? "¡Sí!" : "No";
  // G6: Progress bar
  const pct = Math.max(0, Math.min(100, state.progress * 100));
  if (progressBarFill) progressBarFill.style.width = `${pct}%`;
  if (progressBarCar) progressBarCar.style.left = `${pct}%`;
}

/* ─── COUNTDOWN (G3) ─── */
function startCountdown(callback) {
  state.countdownActive = true;
  countdownOverlay.classList.remove("hidden");
  const steps = [
    { text: "3", delay: 0 },
    { text: "2", delay: 800 },
    { text: "1", delay: 1600 },
    { text: "GO!", delay: 2400 },
  ];
  steps.forEach(({ text, delay }) => {
    setTimeout(() => {
      countdownText.textContent = text;
      countdownText.style.animation = "none";
      void countdownText.offsetWidth;
      countdownText.style.animation = "";
      if (text === "GO!") {
        countdownText.style.color = "#44ff44";
        playSound("go");
      } else {
        countdownText.style.color = "#fff";
        playSound("countdown");
      }
    }, delay);
  });
  setTimeout(() => {
    countdownOverlay.classList.add("hidden");
    state.countdownActive = false;
    if (callback) callback();
  }, 3000);
}

/* ─── CHARACTER SELECTOR (G4+G5) ─── */

// ── Mini 3D preview renderer ──
let prevRenderer = null;
let prevScene = null;
let prevCamera = null;
let prevKartGroup = null;
let prevAnimId = null;

function initPreviewRenderer() {
  const canvas = document.getElementById("vehicle-preview-canvas");
  if (!canvas || prevRenderer) return;

  const w = canvas.clientWidth  || 400;
  const h = canvas.clientHeight || 225;

  prevRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  prevRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  prevRenderer.setSize(w, h, false);
  prevRenderer.shadowMap.enabled = false;

  prevScene = new THREE.Scene();
  prevScene.background = new THREE.Color(0x0d0820);

  prevCamera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
  prevCamera.position.set(4.5, 2.8, 4.5);
  prevCamera.lookAt(0, 0.5, 0);

  const ambPrev = new THREE.AmbientLight(0xffffff, 0.8);
  prevScene.add(ambPrev);
  const dir1 = new THREE.DirectionalLight(0xffffff, 1.4);
  dir1.position.set(5, 10, 6);
  prevScene.add(dir1);
  const dir2 = new THREE.DirectionalLight(0x4488ff, 0.5);
  dir2.position.set(-6, 4, -4);
  prevScene.add(dir2);

  // Floor disc
  const floorMesh = new THREE.Mesh(
    new THREE.CircleGeometry(3.5, 48),
    new THREE.MeshStandardMaterial({ color: 0x1a0840, roughness: 0.9 })
  );
  floorMesh.rotation.x = -Math.PI / 2;
  prevScene.add(floorMesh);
  const grid = new THREE.GridHelper(7, 7, 0x441888, 0x220c44);
  prevScene.add(grid);

  function animatePreview() {
    prevAnimId = requestAnimationFrame(animatePreview);
    if (prevKartGroup) prevKartGroup.rotation.y += 0.012;
    prevRenderer.render(prevScene, prevCamera);
  }
  animatePreview();
}

function updatePreviewKart(characterId) {
  if (!prevScene) initPreviewRenderer();
  if (!prevScene) return;

  if (prevKartGroup) {
    prevScene.remove(prevKartGroup);
    disposeObject3D(prevKartGroup);
    prevKartGroup = null;
  }

  const ch = CONFIG.characters.find((c) => c.id === characterId) || CONFIG.characters[0];
  const result = buildCar(ch.vehicle, ch.color);
  prevKartGroup = result.root;
  prevKartGroup.position.y = 0;
  prevScene.add(prevKartGroup);

  // Draw character portrait on the dedicated portrait canvas
  const portraitCanvas = document.getElementById("preview-portrait-canvas");
  if (portraitCanvas) {
    const pctx = portraitCanvas.getContext("2d");
    pctx.clearRect(0, 0, portraitCanvas.width, portraitCanvas.height);
    pctx.save();
    pctx.scale(portraitCanvas.width / 64, portraitCanvas.height / 80);
    drawCharacterPortrait(pctx, ch.id);
    pctx.restore();
  }

  // Update info panel
  const elName  = document.getElementById("preview-char-name");
  const elKart  = document.getElementById("preview-char-kart");
  const elDesc  = document.getElementById("preview-char-desc");
  if (elName)  elName.textContent  = ch.name;
  if (elKart)  elKart.textContent  = ch.kart || ch.vehicle;
  if (elDesc)  elDesc.textContent  = ch.desc;

  // Update stats bars (1-5 mapped to 20%-100%)
  if (ch.stats) {
    ["velocidad", "aceleracion", "manejo", "peso"].forEach((stat) => {
      const bar = document.getElementById("stat-" + stat);
      if (bar) bar.style.width = ((ch.stats[stat] || 1) / 5 * 100) + "%";
    });
  }
}

function applySelectedKartToCar(characterId) {
  state.selectedKart = characterId;
  window.localStorage.setItem("selectedCharacter", characterId);
  const oldModel = car.userData.model;
  if (oldModel) {
    car.remove(oldModel);
    disposeObject3D(oldModel);
    car.userData.model = null;
  }
  const ch = CONFIG.characters.find((c) => c.id === characterId) || CONFIG.characters[0];
  const fb = buildCar(ch.vehicle, ch.color);
  car.add(fb.root);
  car.userData.wheels = fb.wheels;
  car.userData.wheelRadius = fb.wheelRadius;
  car.userData.bodyMaterials = fb.bodyMaterials;
  car.userData.model = fb.root;
  car.userData.procedural = true;
  // Do NOT call applyCarColor — character colors are baked into the kart
}

function openVehicleMenu() {
  buildVehicleMenu();
  vehicleMenu.classList.remove("hidden");
  // Init preview after menu is visible so canvas has layout size
  requestAnimationFrame(() => {
    initPreviewRenderer();
    updatePreviewKart(state.selectedKart);
  });
}

function buildVehicleMenu() {
  if (!vehicleGrid) return;
  vehicleGrid.innerHTML = CONFIG.characters.map((ch) => {
    const src = getPortraitDataURL(ch.id, 96, 120);
    return `
    <button class="vehicle-card ${ch.id === state.selectedKart ? "active" : ""}" data-character="${ch.id}">
      <img class="char-portrait" src="${src}" alt="${ch.name}" width="48" height="60" />
      <span class="vehicle-name">${ch.name}</span>
    </button>`;
  }).join("");
}

function bindVehicleMenu() {
  if (!vehicleGrid || !vehicleMenu) return;

  vehicleGrid.addEventListener("click", (e) => {
    const btn = e.target.closest(".vehicle-card");
    if (!btn) return;
    const charId = btn.dataset.character;
    vehicleGrid.querySelectorAll(".vehicle-card").forEach((c) =>
      c.classList.toggle("active", c.dataset.character === charId)
    );
    applySelectedKartToCar(charId);
    updatePreviewKart(charId);
  });

  vehicleGrid.addEventListener("mouseover", (e) => {
    const btn = e.target.closest(".vehicle-card");
    if (!btn) return;
    updatePreviewKart(btn.dataset.character);
  });

  if (vehicleClose) {
    vehicleClose.addEventListener("click", () => vehicleMenu.classList.add("hidden"));
  }
  if (titleVehicles) {
    titleVehicles.addEventListener("click", openVehicleMenu);
  }
  if (openCharacter) {
    openCharacter.addEventListener("click", openVehicleMenu);
  }
  if (finishCharacter) {
    finishCharacter.addEventListener("click", openVehicleMenu);
  }
}

/* ─── COLLECTIBLE PICKUP BURST (U3) ─── */
function spawnCollectibleBurst(pos) {
  for (let i = 0; i < 30; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 5;
    const vy = 3 + Math.random() * 4;
    spawnParticle(
      pos.x, pos.y, pos.z,
      Math.cos(angle) * speed, vy, Math.sin(angle) * speed,
      1.0, 0.85, 0.0,
      0.6 + Math.random() * 0.6
    );
  }
  playSound("coin");
}

/* ─── DUST / TURBO PARTICLES ─── */
function spawnDustParticles(center, count, r, g, b) {
  for (let i = 0; i < count; i++) {
    spawnParticle(
      center.x + (Math.random() - 0.5) * 2,
      0.2 + Math.random() * 0.5,
      center.z + (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2, 1 + Math.random() * 2, (Math.random() - 0.5) * 2,
      r, g, b,
      0.3 + Math.random() * 0.4
    );
  }
}

let prevCollected = false;

function animate() {
  const rawDelta = clock.getDelta();
  // B4/T4: Clamp delta to prevent physics explosion on tab-switch
  const delta = Math.min(rawDelta, 0.1);

  // If countdown is active, block input and don't advance game time
  if (state.countdownActive) {
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
    return;
  }

  if (!state.finished) {
    state.time += delta;
  }
  const { center, tangent } = updatePhysics({
    delta,
    state,
    input,
    track,
    trackOps,
    world,
  });
  updateCamera(center, tangent);
  // Shadow light follows car
  dirLight.position.set(center.x + 30, 60, center.z - 40);
  dirLight.target.position.copy(center);
  dirLight.target.updateMatrixWorld();

  sky.position.copy(camera.position);
  updateCheckpoints(center);
  checkFinish();
  animateCollectible(delta);

  // U3: Collectible burst on pickup
  if (state.collectibleCollected && !prevCollected && collectible) {
    spawnCollectibleBurst(collectible.mesh.position);
  }
  prevCollected = state.collectibleCollected;

  // B5/U2: Turbo glow
  turboGlow.material.opacity = state.turboActive > 0 ? 0.35 + Math.sin(clock.elapsedTime * 15) * 0.15 : 0;
  turboGlow.visible = state.turboActive > 0;

  // G7: Particles - drift dust when steering at speed
  if (Math.abs(state.speed) > 10 && (input.left || input.right) && state.jumpY < 0.5) {
    spawnDustParticles(center, 1, 0.6, 0.5, 0.4);
  }
  // Turbo sparks
  if (state.turboActive > 0) {
    spawnDustParticles(center, 2, 0.0, 1.0, 0.8);
  }
  // Mud splash
  if (state.speed > 3) {
    const inMud = mudZones?.some((z) => {
      const dp = Math.abs(state.progress - z.t) * (track?.total ?? 1);
      const dl = Math.abs(state.lateral - z.lateral);
      return dp < z.progressHalf * (track?.total ?? 1) && dl < z.lateralHalf;
    });
    if (inMud) spawnDustParticles(center, 2, 0.35, 0.24, 0.12);
  }
  updateParticles(delta);

  // G5: Sound triggers from physics flags
  if (state.collisionHit) playSound("collision");
  if (state.turboJustActivated) playSound("turbo");
  if (state.trampolineJustLaunched) playSound("trampoline");

  // G5: Engine sound
  updateEngineSound(state.speed);

  if (state.lavaHit && !state.finished) {
    state.lavaHit = false;
    playSound("lava");
    if (deathFlash) {
      deathFlash.classList.remove("hidden");
      void deathFlash.offsetWidth;
      setTimeout(() => deathFlash.classList.add("hidden"), 700);
    }
    resetRun();
  }
  updateHud();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function bindControls() {
  controlButtons.forEach((button) => {
    const key = button.dataset.control;
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      input[key] = true;
      button.classList.add("active");
    });
    button.addEventListener("pointerup", (event) => {
      event.preventDefault();
      input[key] = false;
      button.classList.remove("active");
    });
    button.addEventListener("pointerleave", () => {
      input[key] = false;
      button.classList.remove("active");
    });
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") input.left = true;
    if (event.key === "ArrowRight") input.right = true;
    if (event.key === " " || event.key === "ArrowUp") input.action = true;
    if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") input.reverse = true;
  });

  window.addEventListener("keyup", (event) => {
    if (event.key === "ArrowLeft") input.left = false;
    if (event.key === "ArrowRight") input.right = false;
    if (event.key === " " || event.key === "ArrowUp") input.action = false;
    if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") input.reverse = false;
  });
}

function bindColorPicker() {
  if (!carColorInput) return;
  carColorInput.addEventListener("input", (event) => {
    const nextColor = new THREE.Color(event.target.value);
    state.carColor = nextColor;
    applyCarColor(nextColor);
    window.localStorage.setItem("carColor", event.target.value);
  });
}

function bindLevelMenu() {
  if (!levelMenu || !levelGrid) return;

  levelGrid.addEventListener("click", (event) => {
    const button = event.target.closest(".level-card");
    if (!button) return;
    applyLevel(button.dataset.level);
    resetRun();
    levelMenu.classList.add("hidden");
    startCountdown();
  });

  if (openLevels) {
    openLevels.addEventListener("click", () => {
      levelMenu.classList.remove("hidden");
    });
  }

  if (levelClose) {
    levelClose.addEventListener("click", () => {
      levelMenu.classList.add("hidden");
    });
  }
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function resetRun() {
  state.time = 0;
  state.speed = 0;
  state.lateral = 0;
  state.lateralVel = 0;
  state.progress = 0;
  state.checkpointIndex = 0;
  state.finished = false;
  state.jumpY = 0;
  state.jumpVel = 0;
  state.rampJumped = false;
  state.collectibleCollected = false;
  state.turboActive = 0;
  state.lavaHit = false;
  prevCollected = false;
  finishPanel.classList.add("hidden");
  if (finishNext) {
    finishNext.classList.add("hidden");
  }
  hudCheckpoint.textContent = `0/${state.checkpoints.length}`;
  if (hudCollectible) hudCollectible.textContent = "No";
  if (collectible) {
    collectible.collected = false;
    collectible.mesh.visible = true;
  }
  if (trampolines) trampolines.forEach((t) => { t.launched = false; });
  checkpoints.forEach((gate) => {
    if (gate?.userData?.bannerMaterial) {
      gate.userData.bannerMaterial.color.set(0xffffff);
    }
  });
  if (finishGate?.userData?.bannerMaterial) {
    finishGate.userData.bannerMaterial.color.set(0xffffff);
  }
  // Clear particles
  particles.length = 0;

  // Physically reposition the car and camera at the new track's start
  if (track) {
    const startPos = trackOps.getPoint(track, 0);
    const startTan = trackOps.getTangent(track, 0);
    const left = new THREE.Vector3(-startTan.z, 0, startTan.x).normalize();
    car.position.copy(startPos).addScaledVector(left, state.lateral);
    car.position.y = CONFIG.car.baseY;
    car.rotation.y = Math.atan2(startTan.x, startTan.z);
    ground.position.x = car.position.x;
    ground.position.z = car.position.z;
    // Snap camera behind the car
    const behind = startPos.clone().addScaledVector(startTan, -12);
    behind.y += 7;
    camera.position.copy(behind);
    camera.lookAt(startPos.clone().setY(startPos.y + 2.5));
  }
}

/* ─── TITLE SCREEN (U1) ─── */
function showTitleScreen() {
  if (titleScreen) titleScreen.classList.remove("hidden");
  const appEl = document.getElementById("app");
  if (appEl) appEl.classList.add("hidden");
}

function hideTitleScreen() {
  initAudio();
  if (titleScreen) titleScreen.classList.add("hidden");
  const appEl = document.getElementById("app");
  if (appEl) appEl.classList.remove("hidden");
  startCountdown();
}

bindControls();
buildLevelMenu();
buildVehicleMenu();
bindColorPicker();
bindLevelMenu();
bindVehicleMenu();
applyLevel(state.levelKey);
resetRun();
window.addEventListener("resize", onResize);
// Prevent context menu on long-press (mobile)
document.addEventListener("contextmenu", (e) => e.preventDefault());
// Prevent pinch-to-zoom via touch events
document.addEventListener("touchmove", (e) => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
document.addEventListener("gesturestart", (e) => e.preventDefault(), { passive: false });
finishRestart.addEventListener("click", () => {
  resetRun();
  startCountdown();
});
if (finishNext) {
  finishNext.addEventListener("click", () => {
    const nextLevel = getNextLevelKey();
    if (!nextLevel) return;
    applyLevel(nextLevel);
    resetRun();
    renderer.render(scene, camera);
    startCountdown();
  });
}
if (titlePlay) {
  titlePlay.addEventListener("click", hideTitleScreen);
}

// Add dirLight.target to scene for shadow tracking
scene.add(dirLight.target);

showTitleScreen();
requestAnimationFrame(animate);
