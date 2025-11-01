import React, { useEffect, forwardRef } from 'react';
import { useGLTF } from '@react-three/drei';

const Chair = forwardRef((props, ref) => {
  const { scene } = useGLTF('/models/sofa_glb.glb');

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

export default Chair;
