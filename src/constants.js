export const PHYSICS = {
  accel: 22,
  reverseAccel: 18,
  drag: 0.94,
  maxSpeed: 48,
  maxReverse: 22,
  steerForce: 8,
  driftDrag: 3.4,
  curveForce: 0.0014,
  wheelbase: 4.2,
  maxSteer: 0.38,
  headingDamping: 0.992,
  headingLateralScale: 0.2,
  edgeSlowdown: 0.7,
  obstaclePush: 1.4,
  obstacleReverse: 14,
  obstacleProgressKick: 0.0015,
};

export const TRACK = {
  length: 800,
  segments: 200,
  halfWidth: 6,
  curvatureMajor: Math.PI * 4,
  curvatureMinor: Math.PI * 1.5,
  curvatureMajorAmp: 12,
  curvatureMinorAmp: 6,
  edgeOffset: 0.6,
};

export const CAMERA = {
  fov: 60,
  near: 0.1,
  far: 2000,
  followDistance: 12,
  followHeight: 7,
  followLerp: 0.12,
  lookHeight: 2.5,
};

export const WORLD = {
  groundSize: 4000,
  groundColor: 0x7aa96b,
  trackColor: 0x1d1f25,
  trackEmissive: 0x555555,
  trackEmissiveIntensity: 1.1,
  trackYOffset: 0.12,
  edgeYOffset: 0.18,
  skyColor: 0x7aa2ff,
};

export const HUD = {
  checkpointFractions: [0.25, 0.5, 0.75],
};

export const CHECKPOINT = {
  ringRadius: 2.2,
  ringTube: 0.25,
  ringHeight: 1.4,
  hitRadius: 3.2,
};

export const START = {
  signWidth: 10,
  signHeight: 3,
  signHeightOffset: 0.14,
  signFont: "bold 64px sans-serif",
};

export const FINISH = {
  postWidth: 0.8,
  postHeight: 4.5,
  postDepth: 0.8,
  postSpan: 6.2,
  bannerWidth: 14.0,
  bannerHeight: 1.4,
  bannerDepth: 0.6,
  bannerHeightOffset: 4.8,
  lineWidth: 14.5,
  lineHeight: 2.6,
  lineYOffset: 0.02,
  finishYOffset: 0.2,
};

export const OBSTACLES = {
  layout: [
    { t: 0.18, lateral: -2.2 },
    { t: 0.32, lateral: 2.4 },
    { t: 0.46, lateral: -1.8 },
    { t: 0.58, lateral: 2.0 },
    { t: 0.7, lateral: -2.6 },
    { t: 0.84, lateral: 2.2 },
  ],
  size: 1.6,
  height: 1.4,
  radius: 1.8,
};
