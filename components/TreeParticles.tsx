import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONSTANTS, COLORS } from '../types';
import { generateTreePosition, generateScatterPosition } from '../utils/math';

// Augment JSX namespace to fix missing R3F intrinsic element types
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      points: any;
      bufferGeometry: any;
      bufferAttribute: any;
      shaderMaterial: any;
    }
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      points: any;
      bufferGeometry: any;
      bufferAttribute: any;
      shaderMaterial: any;
    }
  }
}

// Custom Shader Material for performance and visual fidelity
const FoliageMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uProgress: { value: 0 },
    uColorDeep: { value: new THREE.Color(COLORS.EMERALD_DEEP) },
    uColorLight: { value: new THREE.Color(COLORS.EMERALD_LIGHT) },
    uColorGold: { value: new THREE.Color(COLORS.GOLD_BRIGHT) },
  },
  vertexShader: `
    uniform float uTime;
    uniform float uProgress;
    attribute vec3 aTreePos;
    attribute vec3 aScatterPos;
    attribute float aRandom;
    attribute float aSize;
    
    varying vec3 vColor;
    varying float vAlpha;

    // Cubic easing for smooth transitions
    float easeInOutCubic(float x) {
      return x < 0.5 ? 4.0 * x * x * x : 1.0 - pow(-2.0 * x + 2.0, 3.0) / 2.0;
    }

    void main() {
      float t = easeInOutCubic(uProgress);
      
      // Interpolate position
      vec3 pos = mix(aScatterPos, aTreePos, t);
      
      // Add "breathing" and "floating" noise
      float noiseFreq = 2.0;
      float noiseAmp = 0.2 * (1.0 - t * 0.8); // Move less when in tree form
      pos.x += sin(uTime * aRandom + pos.y * noiseFreq) * noiseAmp;
      pos.y += cos(uTime * aRandom + pos.x * noiseFreq) * noiseAmp;
      pos.z += sin(uTime * aRandom + pos.z * noiseFreq) * noiseAmp;

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      // Size attenuation based on depth
      gl_PointSize = aSize * (300.0 / -mvPosition.z);

      // Pass color info
      // When dispersed, use more random gold; when tree, use deep emerald
      vColor = mix(vec3(1.0), vec3(0.0, 0.5, 0.2), t); 
      vAlpha = 0.8 + 0.2 * sin(uTime * 3.0 + aRandom * 10.0);
    }
  `,
  fragmentShader: `
    uniform vec3 uColorDeep;
    uniform vec3 uColorLight;
    uniform vec3 uColorGold;
    
    varying vec3 vColor;
    varying float vAlpha;

    void main() {
      // Circular particle
      vec2 xy = gl_PointCoord.xy - vec2(0.5);
      float r = length(xy);
      if (r > 0.5) discard;

      // Soft glow gradient
      float glow = 1.0 - (r * 2.0);
      glow = pow(glow, 1.5);

      // Color mixing based on "sparkle" logic
      vec3 finalColor = mix(uColorDeep, uColorLight, glow);
      
      // Add gold rim/core randomly
      if (vColor.x > 0.8) { 
         // If labeled as "goldish" in vertex
         finalColor = mix(finalColor, uColorGold, 0.5);
      }

      gl_FragColor = vec4(finalColor, vAlpha * glow);
    }
  `
};

interface TreeParticlesProps {
  progress: number; // 0 to 1
}

const TreeParticles: React.FC<TreeParticlesProps> = ({ progress }) => {
  const shaderRef = useRef<THREE.ShaderMaterial>(null);
  const count = CONSTANTS.PARTICLE_COUNT;

  const [positions, treePos, scatterPos, randoms, sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const tPos = new Float32Array(count * 3);
    const sPos = new Float32Array(count * 3);
    const rands = new Float32Array(count);
    const sz = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const tree = generateTreePosition(i, count);
      const scatter = generateScatterPosition();

      tPos[i * 3] = tree.x;
      tPos[i * 3 + 1] = tree.y;
      tPos[i * 3 + 2] = tree.z;

      sPos[i * 3] = scatter.x;
      sPos[i * 3 + 1] = scatter.y;
      sPos[i * 3 + 2] = scatter.z;

      rands[i] = Math.random();
      sz[i] = Math.random() * 0.5 + 0.5; // Size variation
    }
    return [pos, tPos, sPos, rands, sz];
  }, [count]);

  useFrame((state) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
      // Smoothly interpolate the uniform value for the shader
      shaderRef.current.uniforms.uProgress.value = THREE.MathUtils.lerp(
        shaderRef.current.uniforms.uProgress.value,
        progress,
        0.05
      );
    }
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions} // Initial dummy positions, shader handles placement
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aTreePos"
          count={count}
          array={treePos}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aScatterPos"
          count={count}
          array={scatterPos}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aRandom"
          count={count}
          array={randoms}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aSize"
          count={count}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={shaderRef}
        args={[FoliageMaterial]}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default TreeParticles;