import React, { useRef, useEffect, useMemo, Suspense } from "react";
import { useGLTF, DragControls } from "@react-three/drei";
import * as THREE from "three";
import useStore from "./store";
import { fitModelBoundingBox } from './utils/fitModel';

// Preload most commonly used models
useGLTF.preload("/models/bed_sample.glb");
useGLTF.preload("/models/sofa_glb.glb");
useGLTF.preload("/models/ceiling_fan.glb");
useGLTF.preload("/models/door_pack_free.glb");
useGLTF.preload("/models/window.glb");
useGLTF.preload("/models/lasa_table_by_ton.glb");
useGLTF.preload("/models/toilet.glb");

// Loading placeholder mesh
function LoadingPlaceholder({ size }) {
  return (
    <mesh>
      <boxGeometry args={size} />
      <meshStandardMaterial color="#cccccc" opacity={0.5} transparent />
    </mesh>
  );
}

// Error fallback mesh
function ErrorPlaceholder({ size }) {
  return (
    <mesh>
      <boxGeometry args={size} />
      <meshStandardMaterial color="#ff0000" opacity={0.3} transparent />
    </mesh>
  );
}

const modelMap = {
  bed: "bed_sample.glb",
  chair: "sofa_glb.glb",
  fan: "ceiling_fan.glb",
  door: "door_pack_free.glb",
  window: "window.glb",
  table: "lasa_table_by_ton.glb",
  toilet: "toilet.glb",
  fridge: "cartoon_fridge.glb",
  tv: "70_tv.glb",
  outlet: "outlets.glb",
  table_fan: "table_fan.glb",
  exit_door: "toilet__exit_door.glb",
  partition: "cabin_wall_asset.glb",
  ac: "Ac.glb",
  sink: "bathroom_sink_02.glb",
  double_bed: "double_bed(1).glb",
  dirty_window: "free_dirty_low_poly_window.glb",
  cupboards: "hanging_kitchen_cupboards.glb",
  kitchen_assets: "kitchen_-_assets.glb",
  wall_panel: "cabin_wall_asset.glb",
  cupboard: "old_cupboard.glb",
  lamp: "old_lamp_lowpoly.glb",
  retro_tv: "retro_tv.glb",
  shower: "shower_cabin.glb",
  sofa_large: "sofa_3230.glb",
  switches: "switches_pack.glb",
  table_chairs: "table_and_chairs.glb",
  toilet_alt: "toilet(1).glb",
  tube_light: "tube_light.glb",
  twobed: "Twobed.glb",
  washing_machine: "washing_machine.glb",
  cabin_wall: "cabin_wall_asset.glb",
  door_with_frame: "door_with_frame.glb",
  doors: "doors.glb",
  science_research_table: "science_research_table.glb",
  office_desk: "office_desk.glb",
  square_recessed_led: "square-recessed-led-panel-light-260nw-2628079211.glb",
  sideboard_kitchen: "sideboard_kitchen.glb",
  psx_wooden_chair: "psx_wooden_chair.glb",
  plastic_table: "lasa_table_by_ton.glb",
  table_and_chair: "table_and_chairs.glb",
};

// Model component with error boundary
function Model({ url, elementId, elementType, onFit }) {
  const setElementLoading = useStore((s) => s.setElementLoading);
  const setElementError = useStore((s) => s.setElementError);
  const container = useStore((s) => s.container);
  const updateElement = useStore((s) => s.updateElement);
  const element = useStore((s) => s.elements.find(e => e.id === elementId));

  const { scene } = useGLTF(url,
    // onProgress
    (xhr) => {
      if (xhr.loaded === xhr.total) {
        setElementLoading(elementId, false);
        setElementError(elementId, false);
      }
    },
    // onError
    (error) => {
      console.error(`Error loading model for element ${elementId}:`, error);
      setElementLoading(elementId, false);
      setElementError(elementId, true);
    }
  );

  const clonedScene = useMemo(() => scene.clone(), [scene]);

  // Compute fit to container and update element (scale + position) once when model loads
  useEffect(() => {
    if (!clonedScene) return;

    // Only auto-fit when the element explicitly opts-in via autoFit === true
    if (element && element.autoFit !== true) {
      // clear loading flag even if skipping auto-fit
      setElementLoading(elementId, false);
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps

    try {
      // Compute bounding box in local space
      const bbox = new THREE.Box3().setFromObject(clonedScene);
      const size = new THREE.Vector3();
      bbox.getSize(size);

      // Avoid zero sizes
      const eps = 1e-6;
      const boxX = Math.max(size.x, eps);
      const boxY = Math.max(size.y, eps);
      const boxZ = Math.max(size.z, eps);

      // Container available as { length, width, height }
      const paddingFactor = 0.9; // leave some margin
      const scaleX = container.length / boxX;
      const scaleY = container.height / boxY;
      const scaleZ = container.width / boxZ;
      let scaleFactor = Math.min(scaleX, scaleY, scaleZ) * paddingFactor;
      if (!isFinite(scaleFactor) || scaleFactor <= 0) scaleFactor = 1;

      // Per-type rules (override default behavior for some elements)
      const type = (elementType || '').toLowerCase();
      const topOffset = 0.05; // small offset from walls/ceiling

      // Helper to compute center and translation
      const boxCenter = new THREE.Vector3();
      bbox.getCenter(boxCenter);

      let translation = new THREE.Vector3();

      if (type === 'fan' || type === 'tube_light' || type === 'square_recessed_led') {
        // Keep fan mostly in X/Z fit, but place near ceiling
        const scaleH = Math.min(scaleX, scaleZ) * paddingFactor;
        if (isFinite(scaleH) && scaleH > 0) scaleFactor = Math.min(scaleFactor, scaleH);
        const desiredCenter = new THREE.Vector3(0, container.height - (size.y * scaleFactor) / 2 - topOffset, 0);
        translation = desiredCenter.sub(boxCenter.multiplyScalar(scaleFactor));
      } else if (type === 'door' || type.includes('door')) {
        // Doors should match container height (allow small margin)
        const targetScaleY = (container.height * 0.95) / boxY;
        if (isFinite(targetScaleY) && targetScaleY > 0) scaleFactor = targetScaleY;
        const scaledSize = size.clone().multiplyScalar(scaleFactor);
        const desiredCenter = new THREE.Vector3(0, scaledSize.y / 2, 0);
        translation = desiredCenter.sub(boxCenter.multiplyScalar(scaleFactor));
      } else if (type === 'window' || type === 'dirty_window') {
        // Window: fit to wall width (Z) and place vertically centered
        const targetScaleZ = (container.width * 0.8) / boxZ;
        if (isFinite(targetScaleZ) && targetScaleZ > 0) scaleFactor = Math.min(scaleFactor, targetScaleZ);
        const scaledSize = size.clone().multiplyScalar(scaleFactor);
        const desiredCenter = new THREE.Vector3(0, container.height / 2, 0);
        translation = desiredCenter.sub(boxCenter.multiplyScalar(scaleFactor));
      } else if (type === 'partition' || type === 'cabin_wall' || type === 'wall_panel') {
        // Partition/wall: expand to container height and width if possible
        const targetScaleY = container.height / boxY;
        const targetScaleX = container.length / boxX;
        const targetScaleZ = container.width / boxZ;
        const uniform = Math.min(targetScaleY, targetScaleX, targetScaleZ) * paddingFactor;
        if (isFinite(uniform) && uniform > 0) scaleFactor = uniform;
        const scaledSize = size.clone().multiplyScalar(scaleFactor);
        const desiredCenter = new THREE.Vector3(0, scaledSize.y / 2, 0);
        translation = desiredCenter.sub(boxCenter.multiplyScalar(scaleFactor));
      } else {
        // Default: center on floor
        const scaledSize = size.clone().multiplyScalar(scaleFactor);
        const desiredCenter = new THREE.Vector3(0, scaledSize.y / 2, 0);
        translation = desiredCenter.sub(boxCenter.multiplyScalar(scaleFactor));
      }

      // Final clamps
      if (!isFinite(translation.x)) translation.x = 0;
      if (!isFinite(translation.y)) translation.y = 0;
      if (!isFinite(translation.z)) translation.z = 0;

      // Use utility to compute fit (already computed parts above, but reuse consistent return)
      const fit = fitModelBoundingBox(bbox, container, elementType, paddingFactor);
      if (fit) {
        updateElement(elementId, {
          scale: fit.scaleFactor,
          position: fit.position,
          autoFit: false // prevent re-fitting on future mounts
        });

        if (typeof onFit === 'function') onFit(fit);
      }

      // ensure loading cleared
      setElementLoading(elementId, false);
      setElementError(elementId, false);
    } catch (err) {
      console.error('Error computing fit for model', err);
      setElementLoading(elementId, false);
      setElementError(elementId, true);
    }
  }, [clonedScene, container, elementId, elementType, onFit, updateElement, element, setElementError, setElementLoading]);

  return <primitive object={clonedScene} />;
}

export default React.memo(function DraggableElement({ element }) {
  const meshRef = useRef();
  const { moveElement, snapPosition, validatePosition, updateElement, clampPosition } = useStore();

  const modelFile = modelMap[element.type] || `${element.type}.glb`;
  const modelUrl = element.modelUrl || `/models/${modelFile}`;

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.position.copy(new THREE.Vector3(...element.position));
      meshRef.current.rotation.set(...element.rotation);
      const scale = element.scale || 1;
      meshRef.current.scale.set(...element.size.map(s => s * scale));
    }
  }, [element.position, element.rotation, element.size, element.scale]);



  const handleDragEnd = (event) => {
    if (event && event.object) {
      let newPosition = [event.object.position.x, event.object.position.y, event.object.position.z];
      newPosition = snapPosition(newPosition);
      newPosition = clampPosition(element.id, newPosition);

      if (validatePosition(element.id, newPosition)) {
        // Only save state if position actually changed
        if (
          newPosition[0] !== element.position[0] ||
          newPosition[1] !== element.position[1] ||
          newPosition[2] !== element.position[2]
        ) {
          moveElement(element.id, newPosition);
        }
      } else {
        event.object.position.set(...element.position);
      }
    }
    updateElement(element.id, { dragging: false });
  };

  const handleDragStart = () => updateElement(element.id, { dragging: true });

  // loading/error state handled via store (setElementLoading / setElementError)

  const elementError = useStore((s) => s.elementErrors[element.id]);

  return (
    <DragControls
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <group ref={meshRef} scale={element.size || [1, 1, 1]}>
        <Suspense fallback={<LoadingPlaceholder size={element.size} />}>
          {elementError ? (
            <ErrorPlaceholder size={element.size} />
          ) : (
            <Model 
              url={modelUrl}
              elementId={element.id}
              elementType={element.type}
              onFit={(result) => {
                // Expose fit result for debugging and potential UI use
                // result: { scaleFactor, position: [x,y,z], bboxSize: [bx,by,bz] }
                // You can replace this with a store update or callback prop if needed
                // console.debug('Model fit result', element.id, result);
              }}
            />
          )}
        </Suspense>
      </group>
    </DragControls>
  );
});
