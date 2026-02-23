import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { updatePhysics } from "./physics.js";
import { CONFIG } from "./constants.js";

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

const savedCarColor = (() => {
  const raw = window.localStorage.getItem("carColor");
  if (!raw) return "#ff2d2d";
  if (!/^#[0-9a-fA-F]{6}$/.test(raw)) return "#ff2d2d";
  return raw;
})();

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
container.appendChild(renderer.domElement);

const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
dirLight.position.set(30, 60, -40);
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
const fallbackCar = buildCar();
car.add(fallbackCar.root);
car.userData = {
  wheels: fallbackCar.wheels,
  wheelRadius: fallbackCar.wheelRadius,
  wheelSpin: 0,
  bodyMaterials: fallbackCar.bodyMaterials,
};
car.position.y = CONFIG.car.baseY;
scene.add(car);
loadCarModel(car, fallbackCar.root);
applyCarColor(state.carColor);
if (carColorInput) carColorInput.value = savedCarColor;

let world = { car, ground, obstacles: [], ramps: [], trees: [], turboPads: [], trampolines: [], lavaZones: [], mudZones: [], collectible: null };
const trackOps = {
  getPoint: getTrackPoint,
  getTangent: getTrackTangent,
  getCurvature: getTrackCurvature,
};

const clock = new THREE.Clock();

function buildLevelMenu() {
  if (!levelGrid || !Array.isArray(CONFIG.levels)) return;
  levelGrid.innerHTML = CONFIG.levels
    .map(
      (level, i) => `
        <button class="level-card" data-level="${level.key}" style="--thumb: ${level.thumbColor}">
          <div class="level-thumb"></div>
          <div class="level-number">${i + 1}. ${level.world ?? ""}</div>
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

function clearLevelScene() {
  if (track) {
    scene.remove(track.mesh, track.leftEdgeMesh, track.rightEdgeMesh);
    if (track.tailMesh) scene.remove(track.tailMesh);
  }
  if (checkpoints) {
    checkpoints.forEach((gate) => scene.remove(gate));
  }
  if (finishGate) scene.remove(finishGate);
  if (startLine) scene.remove(startLine);
  if (obstacles) obstacles.forEach((obstacle) => scene.remove(obstacle.mesh));
  if (ramps) ramps.forEach((ramp) => scene.remove(ramp.mesh));
  if (trees) trees.forEach((tree) => scene.remove(tree.mesh));
  if (turboPads) turboPads.forEach((pad) => scene.remove(pad.mesh));
  if (trampolines) trampolines.forEach((tramp) => scene.remove(tramp.mesh));
  if (lavaZones) lavaZones.forEach((zone) => scene.remove(zone.mesh));
  if (mudZones) mudZones.forEach((zone) => scene.remove(zone.mesh));
  if (collectible) scene.remove(collectible.mesh);
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
  loadRockModels(obstacles);

  ramps = buildRamps(track, obstacles);
  ramps.forEach((ramp) => scene.add(ramp.mesh));

  trees = buildTrees(track, level);
  trees.forEach((tree) => scene.add(tree.mesh));
  loadTreeModels(trees);

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


function buildCar() {
  const group = new THREE.Group();

  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xff4d4d, roughness: 0.6, metalness: 0.1 });
  const darkMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
  const trimMaterial = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.7, metalness: 0.2 });
  const glassMaterial = new THREE.MeshStandardMaterial({
    color: 0x88c8ff,
    transparent: true,
    opacity: 0.45,
    roughness: 0.2,
    metalness: 0.1,
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.0, 4.6), bodyMaterial);
  body.position.y = 2.1;
  group.add(body);

  const cab = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.9, 2.2), bodyMaterial);
  cab.position.set(0, 2.8, -0.4);
  group.add(cab);

  const glass = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.7, 2.0), glassMaterial);
  glass.position.set(0, 2.85, -0.45);
  group.add(glass);

  const bumper = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.4, 0.6), darkMaterial);
  bumper.position.set(0, 1.2, 2.5);
  group.add(bumper);

  const skid = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.3, 2.2), trimMaterial);
  skid.position.set(0, 1.0, 0.4);
  group.add(skid);

  const wheelGeometry = new THREE.CylinderGeometry(1.0, 1.0, 0.7, 18);
  wheelGeometry.rotateZ(Math.PI / 2);
  const wheelOffsets = [
    [-1.7, 1.0, 1.6],
    [1.7, 1.0, 1.6],
    [-1.7, 1.0, -1.6],
    [1.7, 1.0, -1.6],
  ];
  const wheels = [];
  wheelOffsets.forEach(([x, y, z]) => {
    const wheel = new THREE.Mesh(wheelGeometry, darkMaterial);
    wheel.position.set(x, y, z);
    group.add(wheel);
    wheels.push(wheel);
  });

  const fenderGeometry = new THREE.BoxGeometry(1.4, 0.6, 1.6);
  const fenderOffsets = [
    [-1.7, 1.8, 1.6],
    [1.7, 1.8, 1.6],
    [-1.7, 1.8, -1.6],
    [1.7, 1.8, -1.6],
  ];
  fenderOffsets.forEach(([x, y, z]) => {
    const fender = new THREE.Mesh(fenderGeometry, trimMaterial);
    fender.position.set(x, y, z);
    group.add(fender);
  });


  group.scale.set(0.85, 0.85, 0.85);

  return { root: group, wheels, wheelRadius: 0.85, bodyMaterials: [bodyMaterial] };
}

function loadCarModel(parent, fallbackRoot) {
  const loader = new GLTFLoader();
  loader.load(
    "assets/models/Humvee.glb",
    (gltf) => {
      const model = gltf.scene;
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = false;
          child.receiveShadow = false;
        }
      });

      let box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      if (size.x > size.z) {
        model.rotation.y = Math.PI / 2;
      }

      box = new THREE.Box3().setFromObject(model);
      const rotatedSize = box.getSize(new THREE.Vector3());
      const targetLength = 4.2;
      const scale = targetLength / Math.max(0.01, rotatedSize.z);
      model.scale.setScalar(scale);

      box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.x -= center.x;
      model.position.z -= center.z;
      model.position.y -= box.min.y;

      parent.remove(fallbackRoot);
      parent.add(model);

      const wheelMatches = [];
      model.traverse((child) => {
        if (child.isMesh && /wheel|tire|tyre/i.test(child.name)) {
          wheelMatches.push(child);
        }
      });

      let wheelRadius = 0.6;
      if (wheelMatches.length) {
        const wheelBox = new THREE.Box3().setFromObject(wheelMatches[0]);
        const wheelSize = wheelBox.getSize(new THREE.Vector3());
        wheelRadius = Math.max(wheelSize.x, wheelSize.y, wheelSize.z) * 0.5;
      }

      parent.userData.wheels = wheelMatches;
      parent.userData.wheelRadius = wheelRadius;
      parent.userData.model = model;
      applyCarColor(state.carColor);
    },
    undefined,
    () => {}
  );
}

function loadRockModels(obstaclesList) {
  const loader = new GLTFLoader();
  const sources = [];
  const paths = ["assets/models/Rock.glb", "assets/models/Rock_2.glb", "assets/models/Rock_3.glb"];
  let loaded = 0;

  const onLoaded = (scene) => {
    if (scene) {
      scene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = false;
          child.receiveShadow = false;
        }
      });
      sources.push(scene);
    }
    loaded += 1;
    if (loaded === paths.length && sources.length) {
      applyRockToObstacles(obstaclesList, sources);
    }
  };
  paths.forEach((path) => {
    loader.load(
      path,
      (gltf) => onLoaded(gltf.scene),
      undefined,
      () => onLoaded(null)
    );
  });
}

function loadTreeModels(treesList) {
  const loader = new GLTFLoader();
  const sources = [];
  const paths = ["assets/models/Tree.glb", "assets/models/Tree_2.glb", "assets/models/Tree_3.glb"];
  let loaded = 0;

  const onLoaded = (scene) => {
    if (scene) {
      scene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = false;
          child.receiveShadow = false;
        }
      });
      sources.push(scene);
    }
    loaded += 1;
    if (loaded === paths.length && sources.length) {
      applyTreesToObjects(treesList, sources);
    }
  };

  paths.forEach((path) => {
    loader.load(
      path,
      (gltf) => onLoaded(gltf.scene),
      undefined,
      () => onLoaded(null)
    );
  });
}

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

  if (car?.userData?.model) {
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
  if (hudLevel) {
    const idx = (CONFIG.levels ?? []).findIndex((l) => l.key === level.key);
    const total = (CONFIG.levels ?? []).length;
    hudLevel.textContent = `Nivel ${idx + 1}/${total} — ${level.label}`;
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
  const postMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
  const bannerMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });

  const leftPost = new THREE.Mesh(new THREE.BoxGeometry(0.7, 3.6, 0.7), postMaterial);
  const rightPost = new THREE.Mesh(new THREE.BoxGeometry(0.7, 3.6, 0.7), postMaterial);
  const postOffset = trackData.halfWidth + 1.2;
  const bannerWidth = postOffset * 2 + 1.2;
  const banner = new THREE.Mesh(new THREE.BoxGeometry(bannerWidth, 1.0, 0.5), bannerMaterial);

  leftPost.position.set(-postOffset, 1.8, 0);
  rightPost.position.set(postOffset, 1.8, 0);
  banner.position.set(0, 3.6, 0);

  group.add(leftPost, rightPost, banner);

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#111111";
  ctx.font = "bold 54px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("CheckPoint", canvas.width / 2, canvas.height / 2);

  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(bannerWidth, 2.4),
    new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(canvas), color: 0xffffff })
  );
  label.position.set(0, 3.6, 0.3);
  group.add(label);

  const pos = getTrackPoint(trackData, t);
  const tangent = getTrackTangent(trackData, t);
  group.position.copy(pos);
  group.position.y = 0.2;
  group.rotation.y = Math.atan2(tangent.x, tangent.z);

  group.userData = { banner, label, postMaterial, bannerMaterial, kind: "checkpoint" };

  return group;
}

function buildFinishGate(trackData) {
  const group = new THREE.Group();
  const postMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
  const bannerMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });

  const leftPost = new THREE.Mesh(new THREE.BoxGeometry(0.8, 4.5, 0.8), postMaterial);
  const rightPost = new THREE.Mesh(new THREE.BoxGeometry(0.8, 4.5, 0.8), postMaterial);
  const postOffset = trackData.halfWidth + 1.6;
  const bannerWidth = postOffset * 2 + 1.6;
  const banner = new THREE.Mesh(new THREE.BoxGeometry(bannerWidth, 1.4, 0.6), bannerMaterial);
  // Finish line: checkerboard canvas, slightly raised above track to avoid z-fighting
  const finishLineCanvas = document.createElement("canvas");
  finishLineCanvas.width = 128; finishLineCanvas.height = 128;
  const flCtx = finishLineCanvas.getContext("2d");
  const cellSize = 16;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      flCtx.fillStyle = (row + col) % 2 === 0 ? "#ffffff" : "#111111";
      flCtx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
    }
  }
  const finishLineTex = new THREE.CanvasTexture(finishLineCanvas);
  const line = new THREE.Mesh(
    new THREE.PlaneGeometry(bannerWidth + 0.5, 2.6),
    new THREE.MeshStandardMaterial({
      map: finishLineTex,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    })
  );

  leftPost.position.set(-postOffset, 2.2, 0);
  rightPost.position.set(postOffset, 2.2, 0);
  banner.position.set(0, 4.8, 0);
  line.rotation.x = -Math.PI / 2;
  line.position.set(0, 0.04, 0);

  group.add(leftPost, rightPost, banner, line);

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#111111";
  ctx.font = "bold 64px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("FINISH", canvas.width / 2, canvas.height / 2);

  const finishLabel = new THREE.Mesh(
      new THREE.PlaneGeometry(bannerWidth, 1.4),
      new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(canvas), color: 0xffffff })
    );
  finishLabel.position.set(0, 4.8, 0.3);
  group.add(finishLabel);

  const pos = getTrackPoint(trackData, 1);
  const tangent = getTrackTangent(trackData, 1);
  group.position.copy(pos);
  group.position.y = 0.2;
  group.rotation.y = Math.atan2(tangent.x, tangent.z);

  group.userData = { banner, finishLabel, postMaterial, bannerMaterial, kind: "finish" };

  return group;
}

function buildStartLine(trackData) {
  const group = new THREE.Group();

  // Posts
  const postMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
  const leftPost = new THREE.Mesh(new THREE.BoxGeometry(0.6, 3.2, 0.6), postMat);
  const rightPost = new THREE.Mesh(new THREE.BoxGeometry(0.6, 3.2, 0.6), postMat);
  const postOff = trackData.halfWidth + 0.8;
  leftPost.position.set(-postOff, 1.6, 0);
  rightPost.position.set(postOff, 1.6, 0);
  group.add(leftPost, rightPost);

  // Banner box (green)
  const bannerW = postOff * 2 + 1.2;
  const bannerMat = new THREE.MeshStandardMaterial({ color: 0x22cc22 });
  const banner = new THREE.Mesh(new THREE.BoxGeometry(bannerW, 0.8, 0.4), bannerMat);
  banner.position.set(0, 3.2, 0);
  group.add(banner);

  // Text canvas (vertical sign, not on ground)
  const canvas = document.createElement("canvas");
  canvas.width = 512; canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#22cc22";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 72px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("START", canvas.width / 2, canvas.height / 2);
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(bannerW, 1.0),
    new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true })
  );
  label.position.set(0, 3.2, 0.22);
  group.add(label);

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
  let idx = trackData.distances.findIndex((d) => d >= distance);
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
  }
}

function updateHud() {
  hudTime.textContent = state.time.toFixed(2);
  hudSpeed.textContent = Math.round(state.speed * 3.6);
  if (hudCollectible) hudCollectible.textContent = state.collectibleCollected ? "¡Sí!" : "No";
}

function animate() {
  const delta = clock.getDelta();
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
  sky.position.copy(camera.position);
  updateCheckpoints(center);
  checkFinish();
  animateCollectible(delta);
  if (state.lavaHit && !state.finished) {
    state.lavaHit = false;
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
}

bindControls();
buildLevelMenu();
bindColorPicker();
bindLevelMenu();
applyLevel(state.levelKey);
resetRun();
window.addEventListener("resize", onResize);
finishRestart.addEventListener("click", resetRun);
if (finishNext) {
  finishNext.addEventListener("click", () => {
    const nextLevel = getNextLevelKey();
    if (!nextLevel) return;
    applyLevel(nextLevel);
    resetRun();
  });
}
requestAnimationFrame(animate);
