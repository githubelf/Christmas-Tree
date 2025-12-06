import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONSTANTS, COLORS } from '../types';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      mesh: any;
      extrudeGeometry: any;
      meshStandardMaterial: any;
      meshBasicMaterial: any;
    }
  }
}

interface StarProps {
  progress: number;
}

const Star: React.FC<StarProps> = ({ progress }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  const starShape = useMemo(() => {
    const shape = new THREE.Shape();
    const points = 5;
    const outerRadius = 1.2;
    const innerRadius = 0.5;

    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2; // Rotate to point up
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
    return shape;
  }, []);

  const extrudeSettings = useMemo(() => ({
    depth: 0.4,
    bevelEnabled: true,
    bevelThickness: 0.1,
    bevelSize: 0.1,
    bevelSegments: 2
  }), []);

  const topPosition = useMemo(() => new THREE.Vector3(0, CONSTANTS.TREE_HEIGHT / 2 + 1, 0), []);
  const scatterPosition = useMemo(() => new THREE.Vector3(0, 20, 0), []); // Flies up when scattered

  useFrame((state) => {
    if (!meshRef.current) return;
    
    const time = state.clock.getElapsedTime();
    
    // Smooth progress
    const currentP = meshRef.current.userData.progress ?? 0;
    const nextP = THREE.MathUtils.lerp(currentP, progress, 0.05);
    meshRef.current.userData.progress = nextP;
    
    const t = nextP < 0.5 ? 4 * nextP * nextP * nextP : 1 - Math.pow(-2 * nextP + 2, 3) / 2;

    // Position
    meshRef.current.position.lerpVectors(scatterPosition, topPosition, t);
    
    // Rotation
    meshRef.current.rotation.y = time * 0.5;
    meshRef.current.rotation.z = Math.sin(time) * 0.1;
    
    // Scale pulse
    const scale = 1 + Math.sin(time * 2) * 0.1;
    meshRef.current.scale.setScalar(scale * t); // Shrinks to 0 when scattered (or moves away)

    // Glow effect
    if (glowRef.current) {
        glowRef.current.position.copy(meshRef.current.position);
        glowRef.current.rotation.copy(meshRef.current.rotation);
        glowRef.current.scale.setScalar(scale * 1.2 * t);
    }
  });

  return (
    <>
        <mesh ref={meshRef} castShadow>
            <extrudeGeometry args={[starShape, extrudeSettings]} />
            <meshStandardMaterial 
                color={COLORS.GOLD_RICH}
                emissive={COLORS.GOLD_RICH}
                emissiveIntensity={0.5}
                roughness={0.1}
                metalness={1}
            />
        </mesh>
        {/* Glow halo */}
        <mesh ref={glowRef}>
             <extrudeGeometry args={[starShape, { ...extrudeSettings, depth: 0.45, bevelSize: 0.2 }]} />
             <meshBasicMaterial 
                color={COLORS.GOLD_RICH}
                transparent
                opacity={0.3}
                blending={THREE.AdditiveBlending}
             />
        </mesh>
    </>
  );
};

export default Star;