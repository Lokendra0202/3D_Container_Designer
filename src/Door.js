import React, { useEffect, forwardRef } from 'react';
import { useGLTF } from '@react-three/drei';

const Door = forwardRef((props, ref) => {
  const { scene } = useGLTF('/models/door_pack_free.glb');

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

export default Door;
