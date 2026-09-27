export type DynamicsState = {
  appliedFrictionN: number;
  netForceN: number;
  accelerationMps2: number;
};

export function solveForceFriction(
  pullingForceN: number,
  frictionLimitN: number,
  massKg: number,
  speedMps: number,
): DynamicsState {
  const pullingForce = Math.max(0, pullingForceN);
  const frictionLimit = Math.max(0, frictionLimitN);
  const mass = Math.max(0.1, massKg);
  const moving = speedMps > 0.001;
  const appliedFriction = moving
    ? frictionLimit
    : Math.min(pullingForce, frictionLimit);
  const netForce = pullingForce - appliedFriction;

  return {
    appliedFrictionN: appliedFriction,
    netForceN: netForce,
    accelerationMps2: netForce / mass,
  };
}
