import * as THREE from 'three';

// Compute the world-axis-aligned bounding box for an Object3D
export function computeWorldAABB(object) {
  const box = new THREE.Box3();
  box.setFromObject(object);
  return box;
}

// Clamp an AABB so it entirely fits inside the container box (container: { length, width, height })
// Returns a Vector3 delta to apply to the object's position (center translation)
export function clampAABBToContainer(aabb, container, padding = 0) {
  const size = aabb.getSize(new THREE.Vector3());
  const center = aabb.getCenter(new THREE.Vector3());

  // Build container Box3 (room is centered at origin X/Z, floor at Y=0)
  const halfX = container.length / 2;
  const halfZ = container.width / 2;
  const min = new THREE.Vector3(-halfX + padding, 0 + padding, -halfZ + padding);
  const max = new THREE.Vector3(halfX - padding, container.height - padding, halfZ - padding);

  // Allowed center extents (accounting for half-size)
  const halfSize = size.clone().multiplyScalar(0.5);
  const allowedMin = min.clone().add(halfSize);
  const allowedMax = max.clone().sub(halfSize);

  // If allowedMin > allowedMax on any axis, the object is larger than the container interior
  // In that case, we center it within the container on that axis (best-effort)
  const clampedCenter = new THREE.Vector3(
    Math.min(Math.max(center.x, allowedMin.x), allowedMax.x),
    Math.min(Math.max(center.y, allowedMin.y), allowedMax.y),
    Math.min(Math.max(center.z, allowedMin.z), allowedMax.z)
  );

  // For axes where allowedMin > allowedMax (oversized), center inside container
  if (allowedMin.x > allowedMax.x) clampedCenter.x = (min.x + max.x) / 2;
  if (allowedMin.y > allowedMax.y) clampedCenter.y = (min.y + max.y) / 2;
  if (allowedMin.z > allowedMax.z) clampedCenter.z = (min.z + max.z) / 2;

  const delta = clampedCenter.sub(center);
  return delta; // THREE.Vector3
}

// Helper: returns whether aabb is (even slightly) out of bounds given container and padding
export function isAABBOutOfContainer(aabb, container, padding = 0, epsilon = 1e-6) {
  const size = aabb.getSize(new THREE.Vector3());
  const halfX = container.length / 2;
  const halfZ = container.width / 2;
  const min = new THREE.Vector3(-halfX + padding - epsilon, 0 + padding - epsilon, -halfZ + padding - epsilon);
  const max = new THREE.Vector3(halfX - padding + epsilon, container.height - padding + epsilon, halfZ - padding + epsilon);

  if (aabb.min.x < min.x || aabb.min.y < min.y || aabb.min.z < min.z) return true;
  if (aabb.max.x > max.x || aabb.max.y > max.y || aabb.max.z > max.z) return true;
  return false;
}

export default {
  computeWorldAABB,
  clampAABBToContainer,
  isAABBOutOfContainer
};
