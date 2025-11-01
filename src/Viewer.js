import React, { Suspense, useMemo, forwardRef, useImperativeHandle } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import * as THREE from "three";
import useStore from "./store";
import DraggableElement from "./DraggableElement";

function ScreenshotHelper() {
  const { gl, scene, camera } = useThree();

  const takeScreenshot = () => {
    // Force a render to ensure the scene is up to date
    gl.render(scene, camera);
    const canvas = gl.domElement;
    const dataURL = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'container-screenshot.png';
    link.click();
  };

  // Expose the function to the parent via context or ref
  React.useEffect(() => {
    window.takeScreenshot = takeScreenshot;
  }, []);

  return null;
}

function Container() {
  const { container, elements } = useStore();

  const renderedElements = useMemo(
    () => elements.map((el) => <DraggableElement key={el.id} element={el} />),
    [elements]
  );

  const wallThickness = 0.05; // thin but visible walls

  return (
    <group>
      {/* Grid on floor */}
      <Grid args={[container.length, container.width]} position={[0, 0.01, 0]} />

      {/* Floor */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[container.length, container.width]} />
        <meshStandardMaterial color="#f0f0f0" />
      </mesh>

      {/* Roof */}
      <mesh position={[0, container.height, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[container.length, container.width]} />
        <meshStandardMaterial color="#d0d0d0" />
      </mesh>

      {/* Front Wall */}
      <mesh position={[0, container.height / 2, container.width / 2]}>
        <boxGeometry args={[container.length, container.height, wallThickness]} />
        <meshStandardMaterial color="#cccccc" />
      </mesh>

      {/* Back Wall */}
      <mesh position={[0, container.height / 2, -container.width / 2]}>
        <boxGeometry args={[container.length, container.height, wallThickness]} />
        <meshStandardMaterial color="#cccccc" />
      </mesh>

      {/* Left Wall */}
      <mesh position={[-container.length / 2, container.height / 2, 0]}>
        <boxGeometry args={[wallThickness, container.height, container.width]} />
        <meshStandardMaterial color="#cccccc" />
      </mesh>

      {/* Right Wall */}
      <mesh position={[container.length / 2, container.height / 2, 0]}>
        <boxGeometry args={[wallThickness, container.height, container.width]} />
        <meshStandardMaterial color="#cccccc" />
      </mesh>

      {/* Draggable Elements */}
      {renderedElements}
    </group>
  );
}

function Viewer() {
  return (
    <div className="viewer-container">
      <Canvas
        camera={{ position: [10, 10, 10], fov: 50 }}
        shadows
        style={{
          touchAction: 'none' // Prevent default touch behaviors for better drag control
        }}
      >
        <ambientLight intensity={0.3} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />

        <Suspense fallback={null}>
          <Container />
          <ScreenshotHelper />
        </Suspense>

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.1}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          touches={{
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_PAN
          }}
          minDistance={2}
          maxDistance={20}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={0}
          rotateSpeed={0.5}
          zoomSpeed={0.8}
          panSpeed={0.8}
        />
      </Canvas>
    </div>
  );
}

export default Viewer;
