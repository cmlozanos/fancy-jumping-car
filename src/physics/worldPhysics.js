import { CONFIG } from "../constants.js";

export function updateWorldPhysics({ state, track, obstacles, trees, turboPads, trampolines, lavaZones, mudZones, collectible, starItems, delta }) {
  const carHalfX = CONFIG.car.halfX;
  const carProgressHalf = CONFIG.car.halfZ / track.total;
  state.collisionHit = false;
  state.turboJustActivated = false;
  state.trampolineJustLaunched = false;
  state.starJustActivated = false;

  // Decrement star timer
  if (state.starActive > 0) {
    state.starActive = Math.max(0, state.starActive - delta);
  }

  const isInvincible = state.starActive > 0;

  obstacles.forEach((obstacle) => {
    if (state.jumpY > obstacle.height * 0.6) return;
    const dx = Math.abs(state.lateral - obstacle.lateral);
    const dz = Math.abs(state.progress - obstacle.t);
    if (dx < carHalfX + obstacle.lateralHalf && dz < carProgressHalf + obstacle.progressHalf) {
      if (isInvincible) return; // Invincible: pass through obstacles
      const pushDir = Math.sign(state.lateral - obstacle.lateral) || 1;
      state.lateral += pushDir * CONFIG.obstacles.push * delta;
      state.lateralVel *= 0.2;
      state.progress = Math.max(0, state.progress - CONFIG.obstacles.progressKick);
      state.speed = Math.min(state.speed, 0);
      state.speed -= CONFIG.obstacles.reverse * delta;
      state.collisionHit = true;
    }
  });

  trees.forEach((tree) => {
    if (state.jumpY > 2.5) return;
    const dx = Math.abs(state.lateral - tree.lateral);
    const dz = Math.abs(state.progress - tree.t);
    if (dx < carHalfX + tree.lateralHalf && dz < carProgressHalf + tree.progressHalf) {
      if (isInvincible) return; // Invincible: pass through trees
      const pushDir = Math.sign(state.lateral - tree.lateral) || 1;
      state.lateral += pushDir * CONFIG.trees.push * delta;
      state.lateralVel *= CONFIG.trees.lateralDamping;
      state.progress = Math.max(0, state.progress - CONFIG.trees.progressKick);
      state.speed = Math.min(state.speed, 0);
      state.speed -= CONFIG.trees.reverse * delta;
      state.collisionHit = true;
    }
  });

  const prevTurbo = state.turboActive;
  (turboPads ?? []).forEach((pad) => {
    const dx = Math.abs(state.lateral - pad.lateral);
    const dz = Math.abs(state.progress - pad.t);
    if (dx < carHalfX + pad.lateralHalf && dz < carProgressHalf + pad.progressHalf) {
      state.turboActive = CONFIG.turboPads.boostDuration;
    }
  });
  if (state.turboActive > 0 && prevTurbo <= 0) state.turboJustActivated = true;

  (trampolines ?? []).forEach((tramp) => {
    const dx = Math.abs(state.lateral - tramp.lateral);
    const dz = Math.abs(state.progress - tramp.t);
    if (dx < carHalfX + tramp.lateralHalf && dz < carProgressHalf + tramp.progressHalf) {
      if (!tramp.launched && state.jumpY < 1.0) {
        state.jumpVel = CONFIG.trampolines.jumpVel;
        tramp.launched = true;
        state.trampolineJustLaunched = true;
      }
    } else {
      tramp.launched = false;
    }
  });

  if (!state.lavaHit && !state.finished) {
    (lavaZones ?? []).forEach((zone) => {
      if (state.jumpY > 1.4) return;
      const dx = Math.abs(state.lateral - zone.lateral);
      const dz = Math.abs(state.progress - zone.t);
      if (dx < carHalfX + zone.lateralHalf && dz < carProgressHalf + zone.progressHalf) {
        if (!isInvincible) state.lavaHit = true; // Invincible: lava doesn't kill
      }
    });
  }

  (mudZones ?? []).forEach((zone) => {
    if (state.jumpY > 0.8) return;
    const dx = Math.abs(state.lateral - zone.lateral);
    const dz = Math.abs(state.progress - zone.t);
    if (dx < carHalfX + zone.lateralHalf && dz < carProgressHalf + zone.progressHalf) {
      if (isInvincible) return; // Invincible: mud doesn't slow
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

  // Star pickup
  (starItems ?? []).forEach((star) => {
    if (star.collected) return;
    const dx = Math.abs(state.lateral - star.lateral);
    const dz = Math.abs(state.progress - star.t);
    if (dx < carHalfX + star.lateralHalf && dz < carProgressHalf + star.progressHalf) {
      star.collected = true;
      state.starActive = CONFIG.star.duration;
      state.starJustActivated = true;
    }
  });
}
