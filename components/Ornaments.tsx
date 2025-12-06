import React, { useRef, useMemo, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONSTANTS, COLORS } from '../types';
import { generateTreePosition, generateScatterPosition } from '../utils/math';

// Augment JSX namespace to fix missing R3F intrinsic element types
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      instancedMesh: any;
      sphereGeometry: any;
      boxGeometry: any;
      meshStandardMaterial: any;
    }
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      instancedMesh: any;
      sphereGeometry: any;
      boxGeometry: any;
      meshStandardMaterial: any;
    }
  }
}

interface OrnamentsProps {
  progress: number; // 0 to 1
  type: 'sphere' | 'box';
}

const Ornaments: React.FC<OrnamentsProps> = ({ progress, type }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = type === 'sphere' ? 80 : 40; // Fewer boxes (presents) than balls

  // Pre-calculate target positions
  const targets = useMemo(() => {
    const t = [];
    const s = [];
    const rotationSpeeds = [];
    
    for (let i = 0; i < count; i++) {
      // Offset index to ensure ornaments don't overlap perfectly with foliage spiral
      const treeIdx = Math.floor(Math.random() * CONSTANTS.PARTICLE_COUNT);
      // Push ornament slightly outward from tree surface
      const treePos = generateTreePosition(treeIdx, CONSTANTS.PARTICLE_COUNT).multiplyScalar(1.1); 
      const scatterPos = generateScatterPosition();
      
      t.push(treePos);
      s.push(scatterPos);
      rotationSpeeds.push(new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      ));
    }
    return { tree: t, scatter: s, rot: rotationSpeeds };
  }, [count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    if (!meshRef.current) return;
    
    // We handle the lerp in JS for ornaments to allow physics-like rotation
    // Note: In a production app with 10k+ instances, we'd move this to vertex shader too.
    // For <200 instances, JS loop is fine and allows easier matrix manipulation.
    
    const time = state.clock.getElapsedTime();
    const lerpFactor = 0.05; // Smooth damping
    
    // We need to track current visual state. 
    // Since we don't store "current" pos in state to avoid re-renders,
    // we calculate the target based on 'progress' and let the visual transition happen naturally
    // or simply calculate strict position based on progress if we want perfect sync with particles.
    
    // Strict calc for sync with shader:
    const t = progress; // The parent controls the smoothing of 'progress' usually, or we smooth it here
    
    // Let's implement a local smoothed progress to match the shader's "ease" feel
    // However, since we don't have a ref for the *previous* progress easily accessible without ref,
    // we'll calculate position directly based on the passed prop which is already smoothed by the parent?
    // Actually, parent passes raw target (0 or 1). We should smooth it here.
    
    const smoothProgressRef = meshRef.current.userData.smoothProgress ?? 0;
    const nextProgress = THREE.MathUtils.lerp(smoothProgressRef, progress, lerpFactor);
    meshRef.current.userData.smoothProgress = nextProgress;
    
    const easedT = nextProgress < 0.5 ? 4 * nextProgress * nextProgress * nextProgress : 1 - Math.pow(-2 * nextProgress + 2, 3) / 2;

    for (let i = 0; i < count; i++) {
      const start = targets.scatter[i];
      const end = targets.tree[i];
      
      // Position Lerp
      dummy.position.lerpVectors(start, end, easedT);
      
      // Add floating noise when scattered
      if (easedT < 0.9) {
         dummy.position.y += Math.sin(time + i) * 0.02 * (1 - easedT);
         dummy.rotation.x += targets.rot[i].x * 0.01;
         dummy.rotation.y += targets.rot[i].y * 0.01;
      } else {
         // Fix rotation when in tree mode (upright for boxes, random for spheres)
         if (type === 'box') {
             dummy.rotation.set(0, time * 0.1 + i, 0); // Slowly spin boxes
         } else {
             dummy.rotation.set(0, 0, 0);
         }
      }

      // Scale effect: Pop in/out slightly during transition
      const scale = 1 + Math.sin(easedT * Math.PI) * 0.2;
      dummy.scale.setScalar(scale);

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  const materialColor = type === 'sphere' ? COLORS.GOLD_METALLIC : '#ef4444'; // Gold spheres, Red presents

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow receiveShadow>
      {type === 'sphere' ? (
        <sphereGeometry args={[0.25, 32, 32]} />
      ) : (
        <boxGeometry args={[0.4, 0.4, 0.4]} />
      )}
      <meshStandardMaterial 
        color={materialColor}
        roughness={type === 'sphere' ? 0.1 : 0.3}
        metalness={type === 'sphere' ? 0.9 : 0.1}
        emissive={type === 'sphere' ? COLORS.GOLD_METALLIC : '#000'}
        emissiveIntensity={type === 'sphere' ? 0.2 : 0}
      />
    </instancedMesh>
  );
};

export default Ornaments;