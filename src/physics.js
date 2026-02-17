import { updateCarPhysics } from "./physics/carPhysics.js";
import { updateWorldPhysics } from "./physics/worldPhysics.js";

export function updatePhysics({ delta, state, input, track, trackOps, world }) {
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
    delta,
  });

  return { center, tangent };
}