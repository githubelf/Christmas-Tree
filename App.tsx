import React, { useState, useRef, useEffect, useCallback } from 'react';
import Scene from './components/Scene';
import UIOverlay from './components/UIOverlay';
import * as THREE from 'three';

const App: React.FC = () => {
  const [isTreeFormed, setIsTreeFormed] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  
  // Normalized mouse position (-1 to 1) for camera parallax
  const mousePos = useRef({ x: 0, y: 0 });
  
  // Handle standard mouse movement for parallax
  const handleMouseMove = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (cameraActive) return; // Ignore mouse if camera is driving
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = -(e.clientY / window.innerHeight) * 2 + 1;
    mousePos.current = { x, y };
  }, [cameraActive]);

  const handleTouchMove = useCallback((e: React.TouchEvent | TouchEvent) => {
      if (cameraActive) return;
      if (e.touches.length > 0) {
        const x = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
        const y = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
        mousePos.current = { x, y };
      }
  }, [cameraActive]);

  // Handle Camera Gesture Input
  const handleGestureInput = useCallback((data: { x: number; y: number; gesture: string }) => {
      // 1. Perspective Control
      // If hand is detected (x/y are not 0), smooth lerp to that position
      if (data.x !== 0 || data.y !== 0) {
          // Invert Y for camera look-at feel (moving hand up looks up)
          // Adjust sensitivity factor (2)
          mousePos.current.x = THREE.MathUtils.lerp(mousePos.current.x, data.x * 2, 0.1); 
          mousePos.current.y = THREE.MathUtils.lerp(mousePos.current.y, data.y * -2 + 1, 0.1); // Adjust Y mapping
      }

      // 2. State Control via Explicit Gestures
      // 'Open_Palm' -> Unleash (Scatter)
      // 'Closed_Fist' -> Tree Shape
      // 'None' or others -> Maintain current state (allows manual toggle to persist)
      
      if (data.gesture === 'Open_Palm') {
          setIsTreeFormed(false);
      } else if (data.gesture === 'Closed_Fist') {
          setIsTreeFormed(true);
      }
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [handleMouseMove, handleTouchMove]);

  const toggleState = () => {
      // Toggle between Scattered and Tree
      // This works manually even if camera is active, provided the user isn't holding a gesture
      setIsTreeFormed(prev => !prev);
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none">
      <Scene isTreeFormed={isTreeFormed} mousePos={mousePos} />
      <UIOverlay 
        isTreeFormed={isTreeFormed} 
        onToggle={toggleState} 
        cameraActive={cameraActive}
        setCameraActive={setCameraActive}
        onGestureInput={handleGestureInput}
      />
      
      {/* Cinematic Vignette Overlay (CSS based for extra depth) */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] mix-blend-multiply" />
    </div>
  );
};

export default App;