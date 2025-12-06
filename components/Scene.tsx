import React from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, PerspectiveCamera, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';
import GeometricTree from './GeometricTree';
import Star from './Star';
import { COLORS } from '../types';

// Fix JSX Intrinsic Elements
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      ambientLight: any;
      spotLight: any;
      pointLight: any;
      group: any;
      color: any;
    }
  }
}

interface SceneProps {
  isTreeFormed: boolean;
  mousePos: React.MutableRefObject<{ x: number; y: number }>;
}

const CameraRig: React.FC<{ mousePos: React.MutableRefObject<{ x: number; y: number }> }> = ({ mousePos }) => {
  const { camera } = useThree();
  
  useFrame((state) => {
    // Parallax effect based on mouse position
    const targetX = mousePos.current.x * 8; // Increased range
    const targetY = mousePos.current.y * 4;
    
    // Smoothly interpolate camera position
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.05);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.05);
    camera.lookAt(0, 0, 0);
  });

  return null;
};

const SceneContent: React.FC<SceneProps> = ({ isTreeFormed, mousePos }) => {
  const targetProgress = isTreeFormed ? 1 : 0;

  return (
    <>
      <CameraRig mousePos={mousePos} />
      
      {/* Lighting - Optimized for PBR Metallic Materials */}
      <ambientLight intensity={0.5} color={COLORS.EMERALD_DEEP} />
      
      {/* Main Key Light (Warm Gold) */}
      <spotLight 
        position={[20, 20, 20]} 
        angle={0.3} 
        penumbra={0.5} 
        intensity={3} 
        color={COLORS.GOLD_RICH} 
        castShadow 
        shadow-bias={-0.0001}
      />

      {/* Rim Light (Cool White) for edge definition */}
      <spotLight 
        position={[-20, 10, -10]} 
        angle={0.4} 
        intensity={2} 
        color="#ffffff" 
      />

      {/* Fill Light (Emerald) */}
      <pointLight position={[0, -10, 5]} intensity={1} color={COLORS.EMERALD_LIGHT} />

      {/* Environment for reflections */}
      <Environment preset="lobby" background={false} />

      {/* The 3D Geometric Christmas Tree */}
      <group position={[0, -2, 0]}>
        <GeometricTree progress={targetProgress} />
        <Star progress={targetProgress} />
      </group>

      {/* Floor Reflections */}
      <ContactShadows opacity={0.6} scale={40} blur={2.5} far={10} resolution={512} color="#000000" />

      {/* Post Processing for "Cinematic Glow" */}
      <EffectComposer disableNormalPass>
        <Bloom 
            luminanceThreshold={0.9} // Higher threshold so only very bright specular highlights glow
            mipmapBlur 
            intensity={1.0} 
            radius={0.5}
        />
        <Noise opacity={0.02} />
        <Vignette eskil={false} offset={0.1} darkness={1.0} />
      </EffectComposer>
    </>
  );
};

const Scene: React.FC<SceneProps> = (props) => {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ 
        antialias: false, 
        toneMapping: THREE.ACESFilmicToneMapping, 
        toneMappingExposure: 1.2 
      }}
    >
      <PerspectiveCamera makeDefault position={[0, 0, 24]} fov={40} />
      <color attach="background" args={['#050505']} />
      <SceneContent {...props} />
    </Canvas>
  );
};

export default Scene;