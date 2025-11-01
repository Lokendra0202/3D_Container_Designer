import React, { useEffect, forwardRef } from 'react';
import { useGLTF } from '@react-three/drei';

const Bed = forwardRef((props, ref) => {
  const { scene } = useGLTF('/models/bed_sample.glb');

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

export default Bed;
