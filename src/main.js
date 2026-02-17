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
const carColorInput = document.getElementById("car-color");
const controlButtons = document.querySelectorAll(".control-btn");

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
  carColor: new THREE.Color(savedCarColor),
  checkpoints: CONFIG.hud.checkpoints,
  checkpointIndex: 0,
  finished: false,
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
const track = buildTrack(trackTexture);
scene.add(track.mesh);
scene.add(track.leftEdgeMesh);
scene.add(track.rightEdgeMesh);

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

const checkpoints = buildCheckpoints(track);
checkpoints.forEach((gate) => scene.add(gate));

const finishGate = buildFinishGate(track);
scene.add(finishGate);

const startLine = buildStartLine(track);
scene.add(startLine);

const obstacles = buildObstacles(track);
obstacles.forEach((obstacle) => scene.add(obstacle.mesh));
loadRockModels(obstacles);

const ramps = buildRamps(track, obstacles);
ramps.forEach((ramp) => scene.add(ramp.mesh));

const trees = buildTrees(track);
trees.forEach((tree) => scene.add(tree.mesh));
loadTreeModels(trees);

const world = { car, ground, obstacles, ramps, trees };
const trackOps = {
  getPoint: getTrackPoint,
  getTangent: getTrackTangent,
  getCurvature: getTrackCurvature,
};

const clock = new THREE.Clock();

function buildTrack(texture) {
  const length = CONFIG.track.length;
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

  const tailMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(halfWidth * 2, tailLength),
    roadMaterial
  );
  tailMesh.rotation.x = -Math.PI / 2;
  tailMesh.rotation.y = yaw;
  tailMesh.position.copy(center);
  tailMesh.position.y = CONFIG.track.trackYOffset;

  const edgeWidth = CONFIG.track.edgeOffset;
  const leftEdge = new THREE.Mesh(new THREE.BoxGeometry(edgeWidth, 0.1, tailLength), edgeMaterial);
  const rightEdge = new THREE.Mesh(new THREE.BoxGeometry(edgeWidth, 0.1, tailLength), edgeMaterial);

  const leftOffset = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize().multiplyScalar(halfWidth + edgeWidth * 0.5);
  const rightOffset = leftOffset.clone().multiplyScalar(-1);

  leftEdge.position.copy(center).add(leftOffset);
  rightEdge.position.copy(center).add(rightOffset);
  leftEdge.rotation.y = yaw;
  rightEdge.rotation.y = yaw;
  leftEdge.position.y = CONFIG.track.edgeYOffset;
  rightEdge.position.y = CONFIG.track.edgeYOffset;

  return { mesh: tailMesh, leftEdge, rightEdge };
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
  const line = new THREE.Mesh(
    new THREE.PlaneGeometry(bannerWidth + 0.5, 2.6),
    new THREE.MeshStandardMaterial({ color: 0xffffff })
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
  ctx.fillText("START", canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const material = new THREE.MeshStandardMaterial({ map: texture, color: 0xffffff });

  const sign = new THREE.Mesh(new THREE.PlaneGeometry(10, 3), material);
  sign.rotation.x = -Math.PI / 2;
  group.add(sign);

  const pos = getTrackPoint(trackData, 0);
  const tangent = getTrackTangent(trackData, 0);
  group.position.copy(pos);
  group.position.y = 0.14;
  group.rotation.y = Math.atan2(tangent.x, tangent.z);

  return group;
}

function buildObstacles(trackData) {
  return CONFIG.obstacles.layout.map((item) => {
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

function buildTrees(trackData) {
  const count = CONFIG.trees.count;
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
  }
}

function updateHud() {
  hudTime.textContent = state.time.toFixed(2);
  hudSpeed.textContent = Math.round(state.speed * 3.6);
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
  finishPanel.classList.add("hidden");
  hudCheckpoint.textContent = `0/${state.checkpoints.length}`;
}

bindControls();
bindColorPicker();
window.addEventListener("resize", onResize);
finishRestart.addEventListener("click", resetRun);
requestAnimationFrame(animate);
