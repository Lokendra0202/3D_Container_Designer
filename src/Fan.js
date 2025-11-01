import React, { useEffect, forwardRef } from 'react';
import { useGLTF } from '@react-three/drei';

const Fan = forwardRef((props, ref) => {
  const { scene } = useGLTF('/models/ceiling_fan.glb');

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

export default Fan;
