import React, { useEffect, forwardRef } from 'react';
import { useGLTF } from '@react-three/drei';

const Window = forwardRef((props, ref) => {
  const { scene } = useGLTF('/models/window.glb');

  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene]);

  return <primitive ref={ref} object={scene} {...props} />;
});

export default Window;
