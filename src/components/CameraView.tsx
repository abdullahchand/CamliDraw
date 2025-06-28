import React, { useEffect, useRef } from 'react';
import { useCamera } from '../hooks/useCamera';
import { GestureState } from '../types/gestures';
import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { useRef as useReactRef } from 'react';

interface CameraViewProps {
  onGestureDetected: (gesture: GestureState) => void;
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

export const CameraView: React.FC<CameraViewProps> = ({ onGestureDetected }) => {
  const { videoRef, isLoading, error } = useCamera();
  const canvasRef = useReactRef<HTMLCanvasElement>(null);

  useEffect(() => {
    console.log('CameraView effect running', { videoRef: videoRef.current, isLoading });
    if (isLoading) {
      console.log('Effect exiting early (isLoading)', { isLoading });
      return;
    }
    if (!videoRef.current) {
      console.log('Effect exiting early (no videoRef.current)', { videoRef: videoRef.current });
      return;
    }

    let running = true;

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
          console.log('I: MediaPipe onResults called', results);
          if (!running) return;
          if (canvasRef.current && videoRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (!ctx) {
              console.warn('No 2D context on canvas');
              return;
            }
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
              console.log('J: Detected hand landmarks:', results.multiHandLandmarks[0]);
              for (const landmarks of results.multiHandLandmarks) {
                drawConnectors(ctx, landmarks, HAND_CONNECTIONS, { color: '#FF0000', lineWidth: 2 });
                drawLandmarks(ctx, landmarks, { color: '#00FF00', lineWidth: 1 });
              }
            } else {
              console.log('M: No hand landmarks detected in this frame.');
            }
            if (videoRef.current) {
              console.log('N: Camera onFrame running');
            }
          } else {
            console.warn('O: Canvas or video ref missing in onResults');
          }
        });
        console.log('P: MediaPipe Hands onResults handler set');

        if (videoRef.current) {
          const camera = new Camera(videoRef.current, {
            onFrame: async () => {
              if (videoRef.current) {
                try {
                  console.log('Q: Calling hands.send with video frame');
                  await hands.send({ image: videoRef.current });
                  console.log('R: hands.send completed');
                } catch (err) {
                  console.error('S: Error during hands.send:', err);
                }
              } else {
                console.warn('T: videoRef.current is null in onFrame');
              }
            },
            width: 640,
            height: 480,
          });
          camera.start();
          console.log('U: MediaPipe Hands and Camera started');
        } else {
          console.warn('V: videoRef.current is null when creating Camera');
        }
      } catch (err) {
        console.error('W: Error in CameraView init:', err);
      }
    }
    init();
    return () => {
      running = false;
    };
  }, [videoRef, isLoading, onGestureDetected]);

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
        className="w-full h-full object-cover opacity-20 scale-x-[-1]"
        autoPlay
        muted
        playsInline
      />
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 10 }}
      />
    </div>
  );
};