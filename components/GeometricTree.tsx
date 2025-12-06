import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONSTANTS, COLORS } from '../types';
import { generateTreePosition, generateScatterPosition } from '../utils/math';

// Fix JSX Intrinsic Elements
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      instancedMesh: any;
      sphereGeometry: any;
      boxGeometry: any;
      meshStandardMaterial: any;
      group: any;
    }
  }
}

interface GeometricTreeProps {
  progress: number; // 0 to 1
}

const GeometricTree: React.FC<GeometricTreeProps> = ({ progress }) => {
  const sphereRef = useRef<THREE.InstancedMesh>(null);
  const cubeRef = useRef<THREE.InstancedMesh>(null);

  // Configuration for Spheres (Gold & Bronze)
  const spheresData = useMemo(() => {
    const count = CONSTANTS.SPHERE_COUNT;
    const tPos = [];
    const sPos = [];
    const colors = [];
    const rotationSpeeds = [];

    const colorPalette = [
        new THREE.Color(COLORS.GOLD_RICH),
        new THREE.Color(COLORS.GOLD_RICH), // More gold
        new THREE.Color(COLORS.GOLD_DEEP),
        new THREE.Color(COLORS.BRONZE),
    ];

    for (let i = 0; i < count; i++) {
        // Tree position with some noise for volume
        const basePos = generateTreePosition(i, count);
        // Add slight jitter to make it look like a collection of items, not a perfect line
        basePos.x += (Math.random() - 0.5) * 0.5;
        basePos.z += (Math.random() - 0.5) * 0.5;
        basePos.y += (Math.random() - 0.5) * 0.5;

        tPos.push(basePos);
        sPos.push(generateScatterPosition());
        
        // Random color from palette
        colors.push(colorPalette[Math.floor(Math.random() * colorPalette.length)]);
        
        rotationSpeeds.push({
            x: Math.random() * 0.02,
            y: Math.random() * 0.02
        });
    }
    return { tPos, sPos, colors, rotationSpeeds, count };
  }, []);

  // Configuration for Cubes (Gold & Green)
  const cubesData = useMemo(() => {
    const count = CONSTANTS.CUBE_COUNT;
    const tPos = [];
    const sPos = [];
    const colors = [];
    const rotationSpeeds = [];

    const colorPalette = [
        new THREE.Color(COLORS.GOLD_RICH),
        new THREE.Color(COLORS.GREEN_METALLIC),
        new THREE.Color(COLORS.GREEN_METALLIC),
        new THREE.Color(COLORS.GREEN_DARK),
    ];

    for (let i = 0; i < count; i++) {
        const basePos = generateTreePosition(i, count);
        // Cubes fill gaps, maybe slightly further out or in
        basePos.multiplyScalar(0.9 + Math.random() * 0.2);

        tPos.push(basePos);
        sPos.push(generateScatterPosition());
        
        colors.push(colorPalette[Math.floor(Math.random() * colorPalette.length)]);
        
        rotationSpeeds.push({
            x: Math.random() * 0.02,
            y: Math.random() * 0.02
        });
    }
    return { tPos, sPos, colors, rotationSpeeds, count };
  }, []);

  // Initialize Colors
  useLayoutEffect(() => {
    if (sphereRef.current) {
        spheresData.colors.forEach((col, i) => sphereRef.current!.setColorAt(i, col));
        sphereRef.current.instanceColor!.needsUpdate = true;
    }
    if (cubeRef.current) {
        cubesData.colors.forEach((col, i) => cubeRef.current!.setColorAt(i, col));
        cubeRef.current.instanceColor!.needsUpdate = true;
    }
  }, [spheresData, cubesData]);

  // Animation Loop
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    // Smooth progress for animation
    const sphereMesh = sphereRef.current;
    const cubeMesh = cubeRef.current;
    
    // Helper to animate a mesh group
    const animateMesh = (
        mesh: THREE.InstancedMesh, 
        data: typeof spheresData, 
        geometryType: 'sphere' | 'cube'
    ) => {
        if (!mesh) return;
        
        // Store smooth progress in userData
        const currentP = mesh.userData.smoothProgress ?? 0;
        const nextP = THREE.MathUtils.lerp(currentP, progress, 0.05); // Smooth lerp
        mesh.userData.smoothProgress = nextP;

        // Easing function
        const t = nextP < 0.5 ? 4 * nextP * nextP * nextP : 1 - Math.pow(-2 * nextP + 2, 3) / 2;
        
        for (let i = 0; i < data.count; i++) {
            const start = data.sPos[i];
            const end = data.tPos[i];
            
            // 1. Position Interpolation
            dummy.position.lerpVectors(start, end, t);

            // 2. Add floating noise
            // More float when scattered (t near 0), rigid when tree (t near 1)
            const floatIntensity = (1.0 - t) * 0.5 + 0.05; 
            dummy.position.y += Math.sin(time + i * 0.5) * floatIntensity * 0.05;
            
            // 3. Rotation
            // Continuous rotation
            if (geometryType === 'cube') {
                // Cubes tumble
                dummy.rotation.x += data.rotationSpeeds[i].x;
                dummy.rotation.y += data.rotationSpeeds[i].y;
            } else {
                // Spheres just reflect env map, rotation less visible but helpful for reflections
                dummy.rotation.x = i; 
                dummy.rotation.y = i;
            }

            // 4. Scale
            // Pop in slightly
            const scale = geometryType === 'sphere' 
                ? 0.25 + Math.sin(t * Math.PI) * 0.05
                : 0.35 + Math.sin(t * Math.PI) * 0.05;
                
            dummy.scale.setScalar(scale);
            
            dummy.updateMatrix();
            mesh.setMatrixAt(i, dummy.matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
    };

    animateMesh(sphereRef.current!, spheresData, 'sphere');
    animateMesh(cubeRef.current!, cubesData, 'cube');
  });

  return (
    <group>
        {/* SPHERES LAYER */}
        <instancedMesh ref={sphereRef} args={[undefined, undefined, spheresData.count]} castShadow receiveShadow>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial 
                roughness={0.15}
                metalness={0.9}
                envMapIntensity={1.5}
            />
        </instancedMesh>

        {/* CUBES LAYER */}
        <instancedMesh ref={cubeRef} args={[undefined, undefined, cubesData.count]} castShadow receiveShadow>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial 
                roughness={0.25}
                metalness={0.8}
                envMapIntensity={1.2}
            />
        </instancedMesh>
    </group>
  );
};

export default GeometricTree;