import React, { useRef, useEffect, useMemo } from "react";
import { useGLTF, DragControls } from "@react-three/drei";
import * as THREE from "three";
import useStore from "./store";

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

export default React.memo(function DraggableElement({ element }) {
  const meshRef = useRef();
  const { moveElement, snapPosition, validatePosition, updateElement } = useStore();

  const modelFile = element.modelUrl || (modelMap[element.type] ? `/models/${modelMap[element.type]}` : `${element.type}.glb`);
  const { scene } = useGLTF(modelFile);
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.position.copy(new THREE.Vector3(...element.position));
      meshRef.current.rotation.set(...element.rotation);
      const scale = element.scale || 1;
      meshRef.current.scale.set(...element.size.map(s => s * scale));
    }
  }, [element.position, element.rotation, element.size, element.scale]); // Update when these change

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

  return (
    <DragControls
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      transformGroup
    >
      <primitive ref={meshRef} object={clonedScene} scale={element.size || [1, 1, 1]} />
    </DragControls>
  );
});
