import * as THREE from "three";
import { CONFIG } from "../constants.js";

export function updateCarPhysics({
  delta,
  state,
  input,
  track,
  ramps,
  trackOps,
  car,
  ground,
}) {
  const {
    accel,
    reverseAccel,
    drag,
    maxSpeed,
    maxReverse,
    steerForce,
    driftDrag,
    curveForce,
    gravity,
    speedToProgress,
    edgeSlowdown,
    rampJumpSpeedMin,
    rampJumpBoostSpeedFactor,
    rampJumpBoostBase,
  } = CONFIG.physics;

  if (state.turboActive > 0) {
    state.turboActive = Math.max(0, state.turboActive - delta);
    state.speed = CONFIG.turboPads.boostSpeed;
  } else if (input.action && !input.reverse) {
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

  const curvature = trackOps.getCurvature(track, state.progress);
  state.lateralVel += curvature * state.speed * state.speed * curveForce;

  state.lateralVel *= Math.max(0, 1 - driftDrag * delta);
  state.lateral += state.lateralVel * delta;

  state.lateral = Math.max(-track.halfWidth + 0.6, Math.min(track.halfWidth - 0.6, state.lateral));

  state.progress += state.speed * delta * speedToProgress;
  if (state.progress > 1) state.progress = 1;
  if (state.progress < 0) state.progress = 0;
  if (state.progress >= 1 && state.speed > 0) {
    state.speed = 0;
  }

  const center = trackOps.getPoint(track, state.progress);
  const tangent = trackOps.getTangent(track, state.progress);
  const left = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
  const carHalfX = CONFIG.car.halfX;
  const carHalfZ = CONFIG.car.halfZ;
  const carProgressHalf = carHalfZ / track.total;

  let rampContact = false;
  let shouldJump = false;
  let rampLift = 0;
  ramps.forEach((ramp) => {
    const dz = state.progress - ramp.t;
    const rampSpan = ramp.progressHalf * 2;
    const frac = dz / rampSpan + 0.5;
    if (frac < 0 || frac > 1) return;

    const widthAt = ramp.frontWidth + (ramp.backWidth - ramp.frontWidth) * frac;
    const dx = Math.abs(state.lateral - ramp.lateral);
    if (dx > carHalfX + widthAt * 0.5) return;
    rampContact = true;
    const heightAt = ramp.height * frac;
    rampLift = Math.max(rampLift, heightAt);
    if (frac > 0.85 && state.speed > rampJumpSpeedMin) {
      shouldJump = true;
    }
  });

  if (rampLift > 0) {
    state.jumpY = Math.max(state.jumpY, rampLift);
    state.jumpVel = Math.max(0, state.jumpVel);
  }

  if (shouldJump && !state.rampJumped) {
    state.jumpVel = Math.max(
      state.jumpVel,
      Math.abs(state.speed) * rampJumpBoostSpeedFactor + rampJumpBoostBase
    );
    state.rampJumped = true;
  }
  if (!rampContact && state.jumpY === 0) {
    state.rampJumped = false;
  }

  if (rampLift === 0) {
    state.jumpVel += gravity * delta;
    state.jumpY += state.jumpVel * delta;
  }
  if (state.jumpY < 0) {
    state.jumpY = 0;
    state.jumpVel = 0;
  }

  car.position.copy(center).addScaledVector(left, state.lateral);
  ground.position.x = car.position.x;
  ground.position.z = car.position.z;
  car.position.y = CONFIG.car.baseY + state.jumpY;
  const baseYaw = Math.atan2(tangent.x, tangent.z);
  const slip = Math.atan2(state.lateralVel, Math.max(6, Math.abs(state.speed)));
  car.rotation.y = baseYaw + slip * 0.2;

  if (car.userData?.wheels?.length) {
    const radius = car.userData.wheelRadius || 1.0;
    car.userData.wheelSpin += (state.speed * delta) / Math.max(CONFIG.car.wheelSpinMinRadius, radius);
    car.userData.wheels.forEach((wheel) => {
      wheel.rotation.x = car.userData.wheelSpin;
    });
  }

  if (Math.abs(state.lateral) > track.halfWidth - 0.3) {
    state.speed *= edgeSlowdown;
  }

  return { center, tangent };
}
