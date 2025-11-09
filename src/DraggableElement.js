import React, { useRef, useEffect, useMemo, Suspense } from "react";
import { useGLTF, DragControls } from "@react-three/drei";
import * as THREE from "three";
import useStore from "./store";

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
function Model({ url, elementId }) {
  const setElementLoading = useStore((s) => s.setElementLoading);
  const setElementError = useStore((s) => s.setElementError);
  
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
  return <primitive object={clonedScene} />;
}

export default React.memo(function DraggableElement({ element }) {
  const meshRef = useRef();
  const { moveElement, snapPosition, validatePosition, updateElement } = useStore();

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
            />
          )}
        </Suspense>
      </group>
    </DragControls>
  );
});
