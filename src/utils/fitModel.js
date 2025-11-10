import * as THREE from 'three';

// Compute a uniform scale and translation to fit an object bounding box into container bounds.
// box3: THREE.Box3 (in object local space), container: { length, width, height }
// type: optional string to apply per-type rules (fan, door, window, partition etc.)
// paddingFactor: 0-1 fraction to leave margin (default 0.9)
export function fitModelBoundingBox(box3, container, type = '', paddingFactor = 0.9) {
  if (!box3 || !container) return null;

  const size = new THREE.Vector3();
  box3.getSize(size);

  const eps = 1e-6;
  const boxX = Math.max(size.x, eps);
  const boxY = Math.max(size.y, eps);
  const boxZ = Math.max(size.z, eps);

  const scaleX = container.length / boxX;
  const scaleY = container.height / boxY;
  const scaleZ = container.width / boxZ;
  let scaleFactor = Math.min(scaleX, scaleY, scaleZ) * paddingFactor;
  if (!isFinite(scaleFactor) || scaleFactor <= 0) scaleFactor = 1;

  const typeKey = (type || '').toLowerCase();
  const topOffset = 0.05;

  const boxCenter = new THREE.Vector3();
  box3.getCenter(boxCenter);

  let translation = new THREE.Vector3();

  if (typeKey === 'fan' || typeKey === 'tube_light' || typeKey === 'square_recessed_led') {
    const scaleH = Math.min(scaleX, scaleZ) * paddingFactor;
    if (isFinite(scaleH) && scaleH > 0) scaleFactor = Math.min(scaleFactor, scaleH);
    const scaledSize = size.clone().multiplyScalar(scaleFactor);
    const desiredCenter = new THREE.Vector3(0, container.height - scaledSize.y / 2 - topOffset, 0);
    translation = desiredCenter.sub(boxCenter.multiplyScalar(scaleFactor));
  } else if (typeKey === 'door' || typeKey.includes('door')) {
    const targetScaleY = (container.height * 0.95) / boxY;
    if (isFinite(targetScaleY) && targetScaleY > 0) scaleFactor = targetScaleY;
    const scaledSize = size.clone().multiplyScalar(scaleFactor);
    const desiredCenter = new THREE.Vector3(0, scaledSize.y / 2, 0);
    translation = desiredCenter.sub(boxCenter.multiplyScalar(scaleFactor));
  } else if (typeKey === 'window' || typeKey === 'dirty_window') {
    const targetScaleZ = (container.width * 0.8) / boxZ;
    if (isFinite(targetScaleZ) && targetScaleZ > 0) scaleFactor = Math.min(scaleFactor, targetScaleZ);
    const scaledSize = size.clone().multiplyScalar(scaleFactor);
    const desiredCenter = new THREE.Vector3(0, container.height / 2, 0);
    translation = desiredCenter.sub(boxCenter.multiplyScalar(scaleFactor));
  } else if (typeKey === 'partition' || typeKey === 'cabin_wall' || typeKey === 'wall_panel') {
    const targetScaleY = container.height / boxY;
    const targetScaleX = container.length / boxX;
    const targetScaleZ = container.width / boxZ;
    const uniform = Math.min(targetScaleY, targetScaleX, targetScaleZ) * paddingFactor;
    if (isFinite(uniform) && uniform > 0) scaleFactor = uniform;
    const scaledSize = size.clone().multiplyScalar(scaleFactor);
    const desiredCenter = new THREE.Vector3(0, scaledSize.y / 2, 0);
    translation = desiredCenter.sub(boxCenter.multiplyScalar(scaleFactor));
  } else {
    const scaledSize = size.clone().multiplyScalar(scaleFactor);
    const desiredCenter = new THREE.Vector3(0, scaledSize.y / 2, 0);
    translation = desiredCenter.sub(boxCenter.multiplyScalar(scaleFactor));
  }

  if (!isFinite(translation.x)) translation.x = 0;
  if (!isFinite(translation.y)) translation.y = 0;
  if (!isFinite(translation.z)) translation.z = 0;

  return {
    scaleFactor,
    position: [translation.x, translation.y, translation.z],
    bboxSize: [boxX, boxY, boxZ]
  };
}
