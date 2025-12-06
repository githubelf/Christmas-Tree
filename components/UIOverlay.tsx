import React, { useEffect, useRef, useState } from 'react';
// @ts-ignore - Importing from CDN via importmap
import { FilesetResolver, GestureRecognizer } from '@mediapipe/tasks-vision';

interface UIOverlayProps {
  isTreeFormed: boolean;
  onToggle: () => void;
  cameraActive: boolean;
  setCameraActive: (active: boolean) => void;
  onGestureInput?: (data: { x: number; y: number; gesture: string }) => void;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ 
  isTreeFormed, 
  onToggle, 
  cameraActive, 
  setCameraActive,
  onGestureInput
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [detectedGesture, setDetectedGesture] = useState<string>('');
  const gestureRecognizerRef = useRef<any>(null);
  const requestRef = useRef<number | null>(null);

  // Initialize MediaPipe Gesture Recognizer
  useEffect(() => {
    let isActive = true;

    const loadModel = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
        );
        
        if (!isActive) return;

        const recognizer = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });
        
        if (!isActive) return;
        
        gestureRecognizerRef.current = recognizer;
        setModelLoaded(true);
        console.log("Gesture Recognizer Loaded");
      } catch (error) {
        console.error("Failed to load gesture model:", error);
      }
    };

    if (cameraActive && !gestureRecognizerRef.current) {
      loadModel();
    }

    return () => {
      isActive = false;
    };
  }, [cameraActive]);

  // Camera initialization
  useEffect(() => {
    if (cameraActive && videoRef.current) {
      navigator.mediaDevices.getUserMedia({ 
        video: { width: 320, height: 240, frameRate: { ideal: 30 } } 
      })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(err => {
        console.error("Camera access denied:", err);
        setCameraActive(false);
      });
    } else if (!cameraActive && videoRef.current && videoRef.current.srcObject) {
       const stream = videoRef.current.srcObject as MediaStream;
       stream.getTracks().forEach(track => track.stop());
       videoRef.current.srcObject = null;
       setModelLoaded(false);
    }
  }, [cameraActive, setCameraActive]);

  // Recognition Loop
  useEffect(() => {
    if (!cameraActive || !modelLoaded || !onGestureInput) return;

    const predict = () => {
      if (videoRef.current && videoRef.current.readyState === 4 && gestureRecognizerRef.current) {
        const results = gestureRecognizerRef.current.recognizeForVideo(videoRef.current, Date.now());

        let x = 0;
        let y = 0;
        let gesture = 'None';

        if (results.landmarks && results.landmarks.length > 0) {
          const landmarks = results.landmarks[0];
          const centerPoint = landmarks[9]; 
          
          x = 1 - centerPoint.x; 
          y = 1 - centerPoint.y; 

          if (results.gestures && results.gestures.length > 0) {
            const topGesture = results.gestures[0][0];
            if (topGesture.score > 0.6) {
              gesture = topGesture.categoryName;
            }
          }
        }

        const normX = (x * 2) - 1;
        const normY = (y * 2) - 1; 

        onGestureInput({ x: normX, y: normY, gesture });
        setDetectedGesture(gesture);
      }
      requestRef.current = requestAnimationFrame(predict);
    };

    requestRef.current = requestAnimationFrame(predict);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [cameraActive, modelLoaded, onGestureInput]);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 z-10">
      {/* Header */}
      <header className="w-full flex justify-center items-start relative">
        <div className="text-center">
            <h1 className="text-4xl md:text-7xl font-cinzel font-bold text-transparent bg-clip-text bg-gradient-to-b from-[#FFFDD0] to-[#DAA520] drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] tracking-wider">
            MERRY CHRISTMAS
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#DAA520] to-transparent mx-auto mt-2 opacity-80" />
        </div>
        
        {/* Camera Feed / Status - Positioned Absolute Right */}
        <div className="pointer-events-auto absolute right-0 top-0 flex flex-col items-end hidden md:flex">
            <div className={`relative w-32 h-24 border border-[#DAA520]/50 transition-all duration-500 overflow-hidden rounded bg-black/80 ${cameraActive ? 'shadow-[0_0_15px_rgba(218,165,32,0.3)]' : ''}`}>
                {cameraActive && (
                    <video 
                        ref={videoRef} 
                        autoPlay 
                        muted 
                        playsInline 
                        className="w-full h-full object-cover transform scale-x-[-1]" 
                    />
                )}
                {!cameraActive && (
                    <div className="flex items-center justify-center h-full text-[10px] text-[#DAA520] font-cinzel text-center p-2 tracking-widest">
                        CAMERA OFF
                    </div>
                )}
                
                {cameraActive && !modelLoaded && (
                   <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-[#DAA520] text-xs animate-pulse font-cinzel">
                     LOADING...
                   </div>
                )}
                
                <button 
                    onClick={() => setCameraActive(!cameraActive)}
                    className="absolute bottom-1 right-1 bg-[#DAA520]/20 hover:bg-[#DAA520]/40 text-[#DAA520] text-[9px] px-2 py-0.5 border border-[#DAA520]/30 transition-colors uppercase font-cinzel"
                >
                    {cameraActive ? 'OFF' : 'ON'}
                </button>
            </div>
            
            {cameraActive && (
                <div className="text-[10px] text-[#DAA520] mt-2 text-right font-cinzel space-y-1 tracking-wider">
                    <p className={detectedGesture === 'Open_Palm' ? 'text-white drop-shadow-lg' : 'opacity-70'}>✋ UNLEASH</p>
                    <p className={detectedGesture === 'Closed_Fist' ? 'text-white drop-shadow-lg' : 'opacity-70'}>✊ FORM</p>
                </div>
            )}
        </div>
      </header>

      {/* Camera Toggle for Mobile (if needed, visible only on small screens) */}
       <div className="pointer-events-auto md:hidden absolute top-4 right-4">
          <button 
             onClick={() => setCameraActive(!cameraActive)}
             className="text-[#DAA520] border border-[#DAA520] px-3 py-1 text-xs font-cinzel bg-black/50 backdrop-blur-sm"
          >
             {cameraActive ? 'CAM ON' : 'CAM OFF'}
          </button>
       </div>


      {/* Main Interaction Prompt */}
      <div className="flex flex-col items-center justify-center mb-8 pointer-events-auto">
        <div 
            onMouseDown={() => onToggle()} 
            onMouseUp={() => onToggle()}
            onTouchStart={() => onToggle()}
            onTouchEnd={() => onToggle()}
            className="group cursor-pointer relative"
        >
            <div className={`
                w-20 h-20 rounded-full border-[1px] flex items-center justify-center transition-all duration-700 backdrop-blur-sm
                ${isTreeFormed 
                    ? 'border-[#004d00] shadow-[0_0_30px_rgba(0,77,0,0.3)] bg-[#002a1a]/40' 
                    : 'border-[#DAA520] shadow-[0_0_40px_rgba(218,165,32,0.3)] bg-[#3a2000]/40'
                }
            `}>
                 <div className={`transition-transform duration-500 text-2xl ${isTreeFormed ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
                    🎄
                 </div>
                 <div className={`absolute transition-transform duration-500 text-2xl ${!isTreeFormed ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
                    ✨
                 </div>
            </div>
            
            <p className="text-center mt-3 font-cinzel text-xs tracking-[0.2em] text-[#DAA520] opacity-70 group-hover:opacity-100 transition-opacity">
                {cameraActive ? 'GESTURE CONTROL' : 'HOLD'}
            </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full text-center text-[10px] text-[#DAA520]/40 font-cinzel tracking-[0.3em]">
         <p>INTERACTIVE 3D EXPERIENCE</p>
      </footer>
    </div>
  );
};

export default UIOverlay;