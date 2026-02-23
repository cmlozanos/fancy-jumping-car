import { updateCarPhysics } from "./physics/carPhysics.js";
import { updateWorldPhysics } from "./physics/worldPhysics.js";

export function updatePhysics({ delta, state, input, track, trackOps, world }) {
  if (state.finished) {
    state.speed = 0;
    state.lateralVel = 0;
    state.jumpVel = 0;
    return {
      center: trackOps.getPoint(track, state.progress),
      tangent: trackOps.getTangent(track, state.progress),
    };
  }

  const { center, tangent } = updateCarPhysics({
    delta,
    state,
    input,
    track,
    ramps: world.ramps,
    trackOps,
    car: world.car,
    ground: world.ground,
  });

  updateWorldPhysics({
    state,
    track,
    obstacles: world.obstacles,
    trees: world.trees,
    turboPads: world.turboPads,
    trampolines: world.trampolines,
    lavaZones: world.lavaZones,
    mudZones: world.mudZones,
    collectible: world.collectible,
    delta,
  });

  return { center, tangent };
}