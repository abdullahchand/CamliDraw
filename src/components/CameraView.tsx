import React, { useEffect, useRef, useState } from 'react';
import { useCamera, CameraDevice } from '../hooks/useCamera';
import { GestureState } from '../types/gestures';
import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { useRef as useReactRef } from 'react';
import { ChevronDown } from 'lucide-react';

interface CameraViewProps {
  onGestureDetected: (gesture: GestureState) => void;
  onHandPositionUpdate?: (position: { x: number; y: number } | null) => void;
}

function mapVisualGestureToAppGesture(gesture: any): GestureState {
  let type: 'pinch' | 'palm' | 'zoom' | 'fist' | 'none' = 'none';
  switch (gesture.name) {
    case 'pinch':
    case 'point':
      type = 'pinch';
      break;
    case 'palm':
    case 'open':
      type = 'palm';
      break;
    case 'zoom':
      type = 'zoom';
      break;
    case 'fist':
    case 'closed':
      type = 'fist';
      break;
    default:
      type = 'none';
  }
  return {
    type,
    confidence: gesture.score || 1,
    position: { x: 0.5, y: 0.5 },
  };
}

// MediaPipe Hands connections (local constant)
const HAND_CONNECTIONS: [number, number][] = [
  [0,1],[1,2],[2,3],[3,4], // Thumb
  [0,5],[5,6],[6,7],[7,8], // Index
  [0,9],[9,10],[10,11],[11,12], // Middle
  [0,13],[13,14],[14,15],[15,16], // Ring
  [0,17],[17,18],[18,19],[19,20] // Pinky
];

// Wait for video to be ready (has dimensions and is playing)
function waitForVideoReady(video: HTMLVideoElement): Promise<void> {
  return new Promise((resolve) => {
    if (
      video.readyState >= 2 &&
      video.videoWidth > 0 &&
      video.videoHeight > 0
    ) {
      resolve();
    } else {
      video.onloadeddata = () => {
        resolve();
      };
    }
  });
}

export const CameraView: React.FC<CameraViewProps> = ({ onGestureDetected, onHandPositionUpdate }) => {
  // Camera selection state
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(undefined);
  const { videoRef, isLoading, error, devices } = useCamera(selectedDeviceId);
  const canvasRef = useReactRef<HTMLCanvasElement>(null);
  // Store refs for callbacks so they are always up to date
  const gestureCallbackRef = useRef(onGestureDetected);
  const handPositionCallbackRef = useRef(onHandPositionUpdate);
  gestureCallbackRef.current = onGestureDetected;
  handPositionCallbackRef.current = onHandPositionUpdate;
  const [showCameraMenu, setShowCameraMenu] = useState(false);

  // Set default camera on first load if not set
  useEffect(() => {
    // Log available devices and current selection
    console.log('[CameraView] Available camera devices:', devices);
    console.log('[CameraView] Current selectedDeviceId:', selectedDeviceId);
    if (devices.length > 0) {
      const external = devices.find(d => d.label.includes('Logi'));
      // If external camera appears and is not selected, switch to it
      if (external && selectedDeviceId !== external.deviceId) {
        console.log('[CameraView] Switching to external camera:', external.label, external.deviceId);
        setSelectedDeviceId(external.deviceId);
      } else if (
        // If no camera selected, or selectedDeviceId is empty, or selectedDeviceId is not in the device list
        !selectedDeviceId || selectedDeviceId === '' || !devices.some(d => d.deviceId === selectedDeviceId)
      ) {
        console.log('[CameraView] No valid camera selected, defaulting to:', devices[0].label, devices[0].deviceId);
        setSelectedDeviceId(devices[0].deviceId);
      }
    }
  }, [devices, selectedDeviceId]);

  // --- Only run MediaPipe/camera setup ONCE ---
  useEffect(() => {
    if (isLoading || !videoRef.current) return;
    let running = true;
    let lastGesture: GestureState = { type: 'none', confidence: 0, position: { x: 0, y: 0 } };
    const latestLandmarksRef = { current: null as any[] | null };
    let lastPinchPosition: { x: number; y: number } | null = null;

    function detectGesture(landmarks: any[]): GestureState {
      if (!landmarks || landmarks.length !== 21) {
        return { type: 'none', confidence: 0, position: { x: 0, y: 0 } };
      }
      // Helper functions
      const calculateDistance = (a: any, b: any) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
      const getTip = (f: number) => landmarks[[4,8,12,16,20][f]];
      const getPip = (f: number) => landmarks[[3,6,10,14,18][f]];
      const getMcp = (f: number) => landmarks[[2,5,9,13,17][f]];
      const isExtended = (f: number) => {
        const tip = getTip(f), pip = getPip(f), mcp = getMcp(f);
        if (f === 0) return Math.abs(tip.x - mcp.x) > Math.abs(pip.x - mcp.x) + 0.02;
        return mcp.y - tip.y > mcp.y - pip.y + 0.02;
      };
      const extended = [0,1,2,3,4].filter(isExtended);
      const thumbTip = getTip(0), indexTip = getTip(1), middleTip = getTip(2);
      const thumbIndexDist = calculateDistance(thumbTip, indexTip);
      const thumbMiddleDist = calculateDistance(thumbTip, middleTip);
      // Pinch
      if (thumbIndexDist < 0.06 && extended.length <= 1) {
        return { type: 'pinch', confidence: Math.max(0.5, 1 - thumbIndexDist * 15), position: { x: (thumbTip.x + indexTip.x)/2, y: (thumbTip.y + indexTip.y)/2 } };
      }
      // Zoom
      if (isExtended(0) && isExtended(2) && !isExtended(1) && !isExtended(3) && !isExtended(4)) {
        return { type: 'zoom', confidence: 0.8, position: { x: (thumbTip.x + middleTip.x)/2, y: (thumbTip.y + middleTip.y)/2 }, distance: thumbMiddleDist };
      }
      // Fist
      if (extended.length === 0) {
        return { type: 'fist', confidence: 0.9, position: { x: landmarks[9].x, y: landmarks[9].y } };
      }
      // Palm
      if (extended.length >= 4) {
        return { type: 'palm', confidence: 0.8, position: { x: landmarks[0].x, y: landmarks[0].y } };
      }
      // Point
      if (extended.length === 1 && isExtended(1)) {
        return { type: 'pinch', confidence: 0.7, position: { x: indexTip.x, y: indexTip.y } };
      }
      return { type: 'none', confidence: 0, position: { x: 0, y: 0 } };
    }

    async function init() {
      console.log('init() called in CameraView');
      try {
        console.log('D: Waiting for video to be ready');
        await waitForVideoReady(videoRef.current!);
        console.log('E: Video is ready', {
          videoWidth: videoRef.current!.videoWidth,
          videoHeight: videoRef.current!.videoHeight,
          readyState: videoRef.current!.readyState
        });

        console.log('F: Creating MediaPipe Hands instance');
        const hands = new Hands({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });
        console.log('G: MediaPipe Hands instance created');

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.7,
        });
        console.log('H: MediaPipe Hands options set');

        hands.onResults((results) => {
          if (!running) return;
          if (canvasRef.current && videoRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (!ctx) return;
            
            // Set canvas size to match video dimensions
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
              for (const landmarks of results.multiHandLandmarks) {
                const mirroredLandmarks = landmarks.map(pt => ({ ...pt, x: 1 - pt.x }));
                latestLandmarksRef.current = landmarks; // Store original landmarks for gesture detection
                drawConnectors(ctx, mirroredLandmarks, HAND_CONNECTIONS, { color: '#FF0000', lineWidth: 2 });
                drawLandmarks(ctx, mirroredLandmarks, { color: '#00FF00', lineWidth: 1 });
                // --- NEW: Emit hand position for drawing if pinch detected ---
                if (handPositionCallbackRef.current) {
                  const calculateDistance = (a: any, b: any) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
                  // Use original landmarks for drawing coordinates (not mirrored)
                  const getTip = (f: number) => landmarks[[4,8,12,16,20][f]];
                  const getPip = (f: number) => landmarks[[3,6,10,14,18][f]];
                  const getMcp = (f: number) => landmarks[[2,5,9,13,17][f]];
                  const isExtended = (f: number) => {
                    const tip = getTip(f), pip = getPip(f), mcp = getMcp(f);
                    if (f === 0) return Math.abs(tip.x - mcp.x) > Math.abs(pip.x - mcp.x) + 0.02;
                    return mcp.y - tip.y > mcp.y - pip.y + 0.02;
                  };
                  const extended = [0,1,2,3,4].filter(isExtended);
                  const thumbTip = getTip(0), indexTip = getTip(1);
                  const thumbIndexDist = calculateDistance(thumbTip, indexTip);
                  if (thumbIndexDist < 0.06 && extended.length <= 1) {
                    const pinchPos = { x: (thumbTip.x + indexTip.x)/2, y: (thumbTip.y + indexTip.y)/2 };
                    lastPinchPosition = pinchPos;
                    handPositionCallbackRef.current(pinchPos);
                  } else {
                    lastPinchPosition = null;
                    handPositionCallbackRef.current(null);
                  }
                }
              }
            } else {
              latestLandmarksRef.current = null;
              if (handPositionCallbackRef.current) handPositionCallbackRef.current(null);
            }
          }
        });
        console.log('P: MediaPipe Hands onResults handler set');

        if (videoRef.current) {
          // Debug camera frame rate
          let frameCount = 0;
          const startTime = Date.now();
          
          const camera = new Camera(videoRef.current, {
            onFrame: async () => {
              if (videoRef.current) {
                frameCount++;
                if (frameCount % 30 === 0) { // Log every 30 frames
                  const elapsed = (Date.now() - startTime) / 1000;
                  const fps = frameCount / elapsed;
                  console.log('MediaPipe frame count:', frameCount, 'FPS:', fps.toFixed(1), 'at', new Date().toISOString());
                }
                try {
                  await hands.send({ image: videoRef.current });
                } catch (err) {
                  // Ignore errors
                }
              }
            },
            width: 640,
            height: 480,
          });
          camera.start();
          console.log('U: MediaPipe Hands and Camera started');
        }
      } catch (err) {
        console.error('W: Error in CameraView init:', err);
      }
    }
    init();

    // Gesture recognition interval (30fps, decoupled)
    const gestureInterval = setInterval(() => {
      if (!running) return;
      const landmarks = latestLandmarksRef.current;
      let gesture: GestureState = lastGesture;
      if (landmarks) {
        gesture = detectGesture(landmarks);
      } else {
        gesture = { type: 'none', confidence: 0, position: { x: 0, y: 0 } };
      }
      if (
        gesture.type !== lastGesture.type ||
        Math.abs(gesture.confidence - lastGesture.confidence) > 0.1
      ) {
        lastGesture = gesture;
        gestureCallbackRef.current(gesture);
      } else {
        gestureCallbackRef.current(lastGesture);
      }
    }, 33); // 30 FPS (1000ms / 30 ≈ 33ms)

    return () => {
      running = false;
      clearInterval(gestureInterval);
    };
  // Only run on mount (and when videoRef/isLoading change)
  }, [videoRef, isLoading]);

  if (error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-red-900/20 backdrop-blur-sm">
        <div className="text-red-400 text-center p-6 bg-red-900/30 rounded-lg border border-red-400/30">
          <p className="text-lg font-semibold mb-2">Camera Error</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-0">
      <video
        ref={videoRef}
        className="w-full h-full object-cover opacity-20 scale-x-[-1] pointer-events-none"
        autoPlay
        muted
        playsInline
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 10 }}
      />
      {/* Camera selection button and menu */}
      {devices.length > 1 && (
        <>
          <button
            onClick={() => setShowCameraMenu((v) => !v)}
            className="fixed top-6 right-6 z-50 px-4 py-2 bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-lg text-gray-300 hover:text-white transition-colors"
            style={{ minWidth: 120 }}
          >
            {devices.find(d => d.deviceId === selectedDeviceId)?.label || 'Select Camera'}
            <ChevronDown className="w-4 h-4 inline ml-2" />
          </button>
          {showCameraMenu && (
            <div className="fixed top-20 right-6 z-50 bg-gray-900/95 border border-gray-700/50 rounded-lg shadow-lg p-2 flex flex-col min-w-[180px]">
              {devices.map((device) => (
                <button
                  key={device.deviceId}
                  onClick={() => { setSelectedDeviceId(device.deviceId); setShowCameraMenu(false); }}
                  className={`text-left px-3 py-2 rounded hover:bg-gray-800 transition-colors ${device.deviceId === selectedDeviceId ? 'bg-gray-700 text-blue-400 font-semibold' : 'text-gray-200'}`}
                >
                  {device.label}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};