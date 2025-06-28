import * as tf from '@tensorflow/tfjs';
import * as handpose from '@tensorflow-models/handpose';
import { GestureState, Point } from '../types/gestures';

export class TensorFlowGestureDetector {
  private model: handpose.HandPose | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    try {
      console.log('Initializing TensorFlow.js handpose model...');
      
      // Initialize TensorFlow.js backend
      await tf.ready();
      console.log('TensorFlow.js backend ready:', tf.getBackend());
      
      // Try to set WebGL backend for better performance
      try {
        await tf.setBackend('webgl');
        console.log('WebGL backend set successfully');
      } catch (error) {
        console.log('WebGL backend not available, using CPU backend');
        await tf.setBackend('cpu');
      }
      
      // Load the handpose model
      this.model = await handpose.load();
      
      this.isInitialized = true;
      console.log('TensorFlow.js handpose model loaded successfully');
    } catch (error) {
      console.error('Failed to load TensorFlow.js handpose model:', error);
      throw error;
    }
  }

  async detectGesture(video: HTMLVideoElement): Promise<GestureState> {
    if (!this.model || !this.isInitialized) {
      return { type: 'none', confidence: 0, position: { x: 0, y: 0 } };
    }

    try {
      // Predict hand landmarks
      const predictions = await this.model.estimateHands(video);
      
      if (predictions.length === 0) {
        return { type: 'none', confidence: 0, position: { x: 0, y: 0 } };
      }

      const hand = predictions[0];
      const landmarks = hand.landmarks;
      
      // Convert landmarks to our format
      const points = landmarks.map(point => ({
        x: point[0] / video.videoWidth,
        y: point[1] / video.videoHeight,
        z: point[2] || 0
      }));

      return this.analyzeHandGesture(points);
    } catch (error) {
      console.warn('Error detecting hand gesture with TensorFlow:', error);
      return { type: 'none', confidence: 0, position: { x: 0, y: 0 } };
    }
  }

  private analyzeHandGesture(landmarks: Point[]): GestureState {
    if (landmarks.length < 21) {
      return { type: 'none', confidence: 0, position: { x: 0, y: 0 } };
    }

    // Get key points
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];
    
    const thumbMcp = landmarks[2];
    const indexMcp = landmarks[5];
    const middleMcp = landmarks[9];
    const ringMcp = landmarks[13];
    const pinkyMcp = landmarks[17];

    // Calculate distances
    const thumbIndexDistance = this.calculateDistance(thumbTip, indexTip);
    const thumbMiddleDistance = this.calculateDistance(thumbTip, middleTip);

    // Check finger extensions
    const thumbExtended = this.isFingerExtended(thumbTip, landmarks[3], thumbMcp, true);
    const indexExtended = this.isFingerExtended(indexTip, landmarks[6], indexMcp, false);
    const middleExtended = this.isFingerExtended(middleTip, landmarks[10], middleMcp, false);
    const ringExtended = this.isFingerExtended(ringTip, landmarks[14], ringMcp, false);
    const pinkyExtended = this.isFingerExtended(pinkyTip, landmarks[18], pinkyMcp, false);

    const extendedFingers = [thumbExtended, indexExtended, middleExtended, ringExtended, pinkyExtended]
      .filter(extended => extended).length;

    // Gesture detection logic
    if (thumbIndexDistance < 0.05 && extendedFingers <= 1) {
      // Pinch gesture
      return {
        type: 'pinch',
        confidence: Math.max(0.6, 1 - thumbIndexDistance * 20),
        position: {
          x: (thumbTip.x + indexTip.x) / 2,
          y: (thumbTip.y + indexTip.y) / 2
        }
      };
    }

    if (thumbExtended && middleExtended && !indexExtended && !ringExtended && !pinkyExtended) {
      // Zoom gesture
      return {
        type: 'zoom',
        confidence: 0.8,
        position: {
          x: (thumbTip.x + middleTip.x) / 2,
          y: (thumbTip.y + middleTip.y) / 2
        },
        distance: thumbMiddleDistance
      };
    }

    if (extendedFingers === 0) {
      // Fist gesture
      return {
        type: 'fist',
        confidence: 0.9,
        position: {
          x: landmarks[9].x, // Middle of hand
          y: landmarks[9].y
        }
      };
    }

    if (extendedFingers >= 4) {
      // Palm gesture
      return {
        type: 'palm',
        confidence: 0.8,
        position: {
          x: landmarks[9].x, // Middle of hand
          y: landmarks[9].y
        }
      };
    }

    if (extendedFingers === 1 && indexExtended) {
      // Pointing gesture
      return {
        type: 'pinch',
        confidence: 0.7,
        position: {
          x: indexTip.x,
          y: indexTip.y
        }
      };
    }

    return { type: 'none', confidence: 0, position: { x: 0, y: 0 } };
  }

  private calculateDistance(point1: Point, point2: Point): number {
    return Math.sqrt(
      Math.pow(point1.x - point2.x, 2) + 
      Math.pow(point1.y - point2.y, 2)
    );
  }

  private isFingerExtended(tip: Point, pip: Point, mcp: Point, isThumb: boolean): boolean {
    if (isThumb) {
      // For thumb, check horizontal extension
      const tipExtension = Math.abs(tip.x - mcp.x);
      const pipExtension = Math.abs(pip.x - mcp.x);
      return tipExtension > pipExtension + 0.02;
    } else {
      // For other fingers, check vertical extension
      const tipExtension = mcp.y - tip.y;
      const pipExtension = mcp.y - pip.y;
      return tipExtension > pipExtension + 0.02;
    }
  }

  dispose(): void {
    this.model = null;
    this.isInitialized = false;
  }
} 