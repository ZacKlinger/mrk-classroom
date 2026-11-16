export const routeCount = 4;
export const routeColors = ['#007d83', '#b45522', '#6e50a0', '#476a23'];
export const routeDepths = [-0.57, -0.19, 0.19, 0.57];
export function routePoints(index) {
  const z = routeDepths[index];
  if (z === undefined) throw new RangeError('Route must be between 0 and 3');
  return [[-1.44, 1.96, z], [-1.2, 1.96, z], [1.2, 1.87, z], [1.47, 1.87, z], [1.47, 0.65, z], [1.2, 0.65, z], [-1.2, 0.56, z], [-1.48, 0.56, z]];
}
export function teeCount(outlets) {
  if (!Number.isInteger(outlets) || outlets < 1) throw new RangeError('At least one outlet required');
  return outlets - 1;
}
