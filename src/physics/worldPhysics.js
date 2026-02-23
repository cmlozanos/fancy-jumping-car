import { CONFIG } from "../constants.js";

export function updateWorldPhysics({ state, track, obstacles, trees, turboPads, trampolines, lavaZones, mudZones, collectible, delta }) {
  const carHalfX = CONFIG.car.halfX;
  const carProgressHalf = CONFIG.car.halfZ / track.total;
  obstacles.forEach((obstacle) => {
    if (state.jumpY > obstacle.height * 0.6) return;
    const dx = Math.abs(state.lateral - obstacle.lateral);
    const dz = Math.abs(state.progress - obstacle.t);
    if (dx < carHalfX + obstacle.lateralHalf && dz < carProgressHalf + obstacle.progressHalf) {
      const pushDir = Math.sign(state.lateral - obstacle.lateral) || 1;
      state.lateral += pushDir * CONFIG.obstacles.push * delta;
      state.lateralVel *= 0.2;
      state.progress = Math.max(0, state.progress - CONFIG.obstacles.progressKick);
      state.speed = Math.min(state.speed, 0);
      state.speed -= CONFIG.obstacles.reverse * delta;
    }
  });

  trees.forEach((tree) => {
    const dx = Math.abs(state.lateral - tree.lateral);
    const dz = Math.abs(state.progress - tree.t);
    if (dx < carHalfX + tree.lateralHalf && dz < carProgressHalf + tree.progressHalf) {
      const pushDir = Math.sign(state.lateral - tree.lateral) || 1;
      state.lateral += pushDir * CONFIG.trees.push * delta;
      state.lateralVel *= CONFIG.trees.lateralDamping;
      state.progress = Math.max(0, state.progress - CONFIG.trees.progressKick);
      state.speed = Math.min(state.speed, 0);
      state.speed -= CONFIG.trees.reverse * delta;
    }
  });

  (turboPads ?? []).forEach((pad) => {
    const dx = Math.abs(state.lateral - pad.lateral);
    const dz = Math.abs(state.progress - pad.t);
    if (dx < carHalfX + pad.lateralHalf && dz < carProgressHalf + pad.progressHalf) {
      state.turboActive = CONFIG.turboPads.boostDuration;
    }
  });

  (trampolines ?? []).forEach((tramp) => {
    const dx = Math.abs(state.lateral - tramp.lateral);
    const dz = Math.abs(state.progress - tramp.t);
    if (dx < carHalfX + tramp.lateralHalf && dz < carProgressHalf + tramp.progressHalf) {
      if (!tramp.launched && state.jumpY < 1.0) {
        state.jumpVel = CONFIG.trampolines.jumpVel;
        tramp.launched = true;
      }
    } else {
      tramp.launched = false;
    }
  });

  if (!state.lavaHit && !state.finished) {
    (lavaZones ?? []).forEach((zone) => {
      // La losa de lava mide ~0.28 + burbujas ~0.55 → seguro si el coche vuela > 1.4 u
      if (state.jumpY > 1.4) return;
      const dx = Math.abs(state.lateral - zone.lateral);
      const dz = Math.abs(state.progress - zone.t);
      if (dx < carHalfX + zone.lateralHalf && dz < carProgressHalf + zone.progressHalf) {
        state.lavaHit = true;
      }
    });
  }

  (mudZones ?? []).forEach((zone) => {
    // El barro solo frena al coche cuando rueda por él, no cuando vuela
    if (state.jumpY > 0.8) return;
    const dx = Math.abs(state.lateral - zone.lateral);
    const dz = Math.abs(state.progress - zone.t);
    if (dx < carHalfX + zone.lateralHalf && dz < carProgressHalf + zone.progressHalf) {
      if (state.speed > CONFIG.mud.maxSpeed) state.speed = CONFIG.mud.maxSpeed;
      if (state.speed < -CONFIG.mud.maxSpeed) state.speed = -CONFIG.mud.maxSpeed;
      state.lateralVel *= 0.85;
    }
  });

  if (collectible && !collectible.collected && !state.collectibleCollected) {
    const dx = Math.abs(state.lateral - collectible.lateral);
    const dz = Math.abs(state.progress - collectible.t);
    if (dx < carHalfX + collectible.lateralHalf && dz < carProgressHalf + collectible.progressHalf) {
      collectible.collected = true;
      state.collectibleCollected = true;
    }
  }
}
