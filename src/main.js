import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const container = document.getElementById("game");
const hudTime = document.getElementById("hud-time");
const hudSpeed = document.getElementById("hud-speed");
const hudCheckpoint = document.getElementById("hud-checkpoint");
const finishPanel = document.getElementById("finish");
const finishTime = document.getElementById("finish-time");
const finishRestart = document.getElementById("finish-restart");
const carColorInput = document.getElementById("car-color");
const controlButtons = document.querySelectorAll(".control-btn");

const state = {
  running: true,
  time: 0,
  speed: 0,
  lateral: 0,
  lateralVel: 0,
  headingOffset: 0,
  progress: 0,
  carColor: new THREE.Color("#ff2d2d"),
  checkpoints: [0.25, 0.5, 0.75],
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
scene.background = new THREE.Color(0x8fb3ff);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
dirLight.position.set(30, 60, -40);
scene.add(dirLight);

const sky = new THREE.Mesh(
  new THREE.SphereGeometry(600, 24, 16),
  new THREE.MeshBasicMaterial({ color: 0x7aa2ff, side: THREE.BackSide })
);
scene.add(sky);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(4000, 4000),
  new THREE.MeshStandardMaterial({ color: 0x7aa96b })
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
car.position.y = 0.05;
scene.add(car);
loadCarModel(car, fallbackCar.root);
applyCarColor(state.carColor);

const checkpoints = buildCheckpoints(track);
checkpoints.forEach((gate) => scene.add(gate));

const finishGate = buildFinishGate(track);
scene.add(finishGate);

const startLine = buildStartLine(track);
scene.add(startLine);

const obstacles = buildObstacles(track);
obstacles.forEach((obstacle) => scene.add(obstacle.mesh));
loadRockModels(obstacles);

const trees = buildTrees(track);
trees.forEach((tree) => scene.add(tree.mesh));
loadTreeModels(trees);

const clock = new THREE.Clock();

function buildTrack(texture) {
  const length = 800;
  const segments = 200;
  const halfWidth = 9;
  const tailLength = 140;
  const points = [];
  const distances = [];
  let total = 0;

  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const z = t * length;
    const x = Math.sin(t * Math.PI * 4) * 12 + Math.sin(t * Math.PI * 1.5) * 6;
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

    const leftOuter = leftPoint.clone().addScaledVector(left, 0.6);
    const rightOuter = rightPoint.clone().addScaledVector(left, -0.6);

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
    color: 0x1d1f25,
    map: texture,
    emissive: 0x555555,
    emissiveIntensity: 1.1,
    roughness: 0.9,
    metalness: 0.05,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  mesh.position.y = 0.12;

  const edgeMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
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
  leftEdgeMesh.position.y = 0.18;
  rightEdgeMesh.position.y = 0.18;

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
          child.castShadow = true;
          child.receiveShadow = true;
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
          child.castShadow = true;
          child.receiveShadow = true;
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
          child.castShadow = true;
          child.receiveShadow = true;
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
  tailMesh.position.y = 0.12;

  const edgeWidth = 0.6;
  const leftEdge = new THREE.Mesh(new THREE.BoxGeometry(edgeWidth, 0.1, tailLength), edgeMaterial);
  const rightEdge = new THREE.Mesh(new THREE.BoxGeometry(edgeWidth, 0.1, tailLength), edgeMaterial);

  const leftOffset = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize().multiplyScalar(halfWidth + edgeWidth * 0.5);
  const rightOffset = leftOffset.clone().multiplyScalar(-1);

  leftEdge.position.copy(center).add(leftOffset);
  rightEdge.position.copy(center).add(rightOffset);
  leftEdge.rotation.y = yaw;
  rightEdge.rotation.y = yaw;
  leftEdge.position.y = 0.18;
  rightEdge.position.y = 0.18;

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
  const obstaclesData = [
    { t: 0.18, lateral: -2.2 },
    { t: 0.32, lateral: 2.4 },
    { t: 0.46, lateral: -1.8 },
    { t: 0.58, lateral: 2.0 },
    { t: 0.7, lateral: -2.6 },
    { t: 0.84, lateral: 2.2 },
  ];

  return obstaclesData.map((item) => {
    const center = getTrackPoint(trackData, item.t);
    const tangent = getTrackTangent(trackData, item.t);
    const left = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

    const width = 2.4;
    const depth = 2.4;
    const height = 2.1;

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
    };
  });
}

function buildTrees(trackData) {
  const count = 16;
  const trees = [];
  const baseOffset = trackData.halfWidth + 6.5;

  for (let i = 0; i < count; i += 1) {
    const t = 0.06 + (i / (count - 1)) * 0.88;
    const center = getTrackPoint(trackData, t);
    const tangent = getTrackTangent(trackData, t);
    const left = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const side = i % 2 === 0 ? 1 : -1;
    const jitter = (Math.sin(i * 12.7) + 1) * 0.6;
    const lateral = side * (baseOffset + jitter);

    const width = 3.2;
    const depth = 3.2;
    const height = 6.5;

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

function updateCar(delta) {
  const accel = 22;
  const reverseAccel = 18;
  const drag = 0.975;
  const maxSpeed = 48;
  const maxReverse = 22;
  const steerForce = 14;
  const driftDrag = 2.4;
  const curveForce = 0.0022;
  const wheelbase = 4.2;
  const maxSteer = 0.55;

  if (input.action && !input.reverse) {
    state.speed = Math.min(maxSpeed, state.speed + accel * delta);
  } else if (input.reverse) {
    state.speed = Math.max(-maxReverse, state.speed - reverseAccel * delta);
  } else {
    state.speed *= drag;
  }

  if (Math.abs(state.speed) > 0.5) {
    if (input.left) state.lateralVel -= steerForce * delta;
    if (input.right) state.lateralVel += steerForce * delta;
  } else {
    state.lateralVel *= 0.6;
  }

  const curvature = getTrackCurvature(track, state.progress);
  state.lateralVel += curvature * state.speed * state.speed * curveForce;

  state.lateralVel *= Math.max(0, 1 - driftDrag * delta);
  state.lateral += state.lateralVel * delta;

  state.lateral = Math.max(-track.halfWidth + 0.6, Math.min(track.halfWidth - 0.6, state.lateral));

  state.progress += state.speed * delta * 0.0025;
  const maxProgress = 1;
  if (state.progress > maxProgress) state.progress = maxProgress;
  if (state.progress < 0) state.progress = 0;
  if (state.progress >= 1 && state.speed > 0) {
    state.speed = 0;
  }

  const center = getTrackPoint(track, state.progress);
  const tangent = getTrackTangent(track, state.progress);
  const left = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

  car.position.copy(center).addScaledVector(left, state.lateral);
  ground.position.x = car.position.x;
  ground.position.z = car.position.z;
  car.position.y = 0.05;
  const baseYaw = Math.atan2(tangent.x, tangent.z);
  const slip = Math.atan2(state.lateralVel, Math.max(6, Math.abs(state.speed)));
  car.rotation.y = baseYaw + slip * 0.2;

  if (car.userData?.wheels?.length) {
    const radius = car.userData.wheelRadius || 1.0;
    car.userData.wheelSpin += (state.speed * delta) / Math.max(0.1, radius);
    car.userData.wheels.forEach((wheel) => {
      wheel.rotation.x = car.userData.wheelSpin;
    });
  }

  if (Math.abs(state.lateral) > track.halfWidth - 0.3) {
    state.speed *= 0.7;
  }

  const carHalfX = 1.5;
  const carHalfZ = 2.0;
  const carProgressHalf = carHalfZ / track.total;
  obstacles.forEach((obstacle) => {
    const dx = Math.abs(state.lateral - obstacle.lateral);
    const dz = Math.abs(state.progress - obstacle.t);
    if (dx < carHalfX + obstacle.lateralHalf && dz < carProgressHalf + obstacle.progressHalf) {
      const pushDir = Math.sign(state.lateral - obstacle.lateral) || 1;
      state.lateral += pushDir * 1.4 * delta;
      state.lateralVel *= 0.2;
      state.progress = Math.max(0, state.progress - 0.0015);
      state.speed = Math.min(state.speed, 0);
      state.speed -= 14 * delta;
    }
  });

  trees.forEach((tree) => {
    const dx = Math.abs(state.lateral - tree.lateral);
    const dz = Math.abs(state.progress - tree.t);
    if (dx < carHalfX + tree.lateralHalf && dz < carProgressHalf + tree.progressHalf) {
      const pushDir = Math.sign(state.lateral - tree.lateral) || 1;
      state.lateral += pushDir * 2.2 * delta;
      state.lateralVel *= 0.1;
      state.progress = Math.max(0, state.progress - 0.002);
      state.speed = Math.min(state.speed, 0);
      state.speed -= 18 * delta;
    }
  });

  updateCamera(center, tangent);
  sky.position.copy(camera.position);
  updateCheckpoints(center);
  checkFinish();
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
  updateCar(delta);
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
  state.headingOffset = 0;
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
