import { CONFIG } from "../constants.js";

export function updateWorldPhysics({ state, track, obstacles, trees, delta }) {
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
}
