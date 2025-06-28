import { GestureState, Point } from '../types/gestures';

export class SimpleGestureDetector {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private previousFrame: ImageData | null = null;
  private isInitialized = false;
  private gestureCounter = 0;
  private noGestureCounter = 0;
  private currentGesture: GestureState = { type: 'none', confidence: 0, position: { x: 0, y: 0 } };

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  async initialize(): Promise<void> {
    try {
      console.log('Initializing simple gesture detection...');
      this.isInitialized = true;
      console.log('Simple gesture detection initialized successfully');
    } catch (error) {
      console.error('Failed to initialize simple gesture detection:', error);
      throw error;
    }
  }

  async detectGesture(video: HTMLVideoElement): Promise<GestureState> {
    if (!this.isInitialized) {
      return { type: 'none', confidence: 0, position: { x: 0, y: 0 } };
    }

    try {
      // Set canvas size to match video
      this.canvas.width = video.videoWidth;
      this.canvas.height = video.videoHeight;

      // Draw current frame
      this.ctx.drawImage(video, 0, 0, this.canvas.width, this.canvas.height);
      const currentFrame = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

      // Analyze the frame
      const analysis = this.analyzeFrame(currentFrame);

      // Update previous frame
      this.previousFrame = currentFrame;

      return analysis;
    } catch (error) {
      console.warn('Error in simple gesture detection:', error);
      return { type: 'none', confidence: 0, position: { x: 0, y: 0 } };
    }
  }

  private analyzeFrame(frame: ImageData): GestureState {
    const data = frame.data;
    const width = frame.width;
    const height = frame.height;

    // Analyze different regions of the frame
    const regions = this.analyzeRegions(data, width, height);
    
    // Detect motion if we have a previous frame
    let motionScore = 0;
    if (this.previousFrame) {
      motionScore = this.detectMotion(frame, this.previousFrame);
    }

    // Determine gesture based on analysis
    const newGesture = this.determineGesture(regions, motionScore);
    
    // Apply hysteresis to prevent flickering
    return this.updateGestureState(newGesture);
  }

  private updateGestureState(gesture: GestureState): GestureState {
    if (gesture.type !== 'none') {
      this.gestureCounter++;
      this.noGestureCounter = 0;
      
      // Require fewer consecutive detections for lower motion scores
      const requiredDetections = gesture.confidence > 0.3 ? 2 : 3;
      
      if (this.gestureCounter >= requiredDetections) {
        this.currentGesture = gesture;
        this.gestureCounter = requiredDetections; // Cap the counter
      }
    } else {
      this.noGestureCounter++;
      this.gestureCounter = 0;
      
      // Require more consecutive no-gesture detections to clear
      const requiredNoDetections = 5; // Increased from 3
      
      if (this.noGestureCounter >= requiredNoDetections) {
        this.currentGesture = gesture;
        this.noGestureCounter = requiredNoDetections; // Cap the counter
      }
    }

    return this.currentGesture;
  }

  private analyzeRegions(data: Uint8ClampedArray, width: number, height: number) {
    const regions = {
      center: { brightness: 0, motion: 0 },
      left: { brightness: 0, motion: 0 },
      right: { brightness: 0, motion: 0 },
      top: { brightness: 0, motion: 0 },
      bottom: { brightness: 0, motion: 0 }
    };

    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    const regionSize = Math.min(width, height) / 3; // Smaller regions for better precision

    // Sample pixels from different regions - more frequent sampling
    for (let y = 0; y < height; y += 2) { // Sample every 2nd pixel (was 4)
      for (let x = 0; x < width; x += 2) { // Sample every 2nd pixel (was 4)
        const index = (y * width + x) * 4;
        const brightness = (data[index] + data[index + 1] + data[index + 2]) / 3;

        // Determine which region this pixel belongs to
        if (Math.abs(x - centerX) < regionSize && Math.abs(y - centerY) < regionSize) {
          regions.center.brightness += brightness;
        } else if (x < centerX - regionSize) {
          regions.left.brightness += brightness;
        } else if (x > centerX + regionSize) {
          regions.right.brightness += brightness;
        } else if (y < centerY - regionSize) {
          regions.top.brightness += brightness;
        } else if (y > centerY + regionSize) {
          regions.bottom.brightness += brightness;
        }
      }
    }

    // Normalize brightness values
    const totalPixels = (width * height) / 4; // Due to sampling every 2nd pixel
    Object.values(regions).forEach(region => {
      region.brightness /= totalPixels;
    });

    return regions;
  }

  private detectMotion(current: ImageData, previous: ImageData): number {
    const currentData = current.data;
    const previousData = previous.data;
    let motionPixels = 0;
    let totalPixels = 0;
    let totalDifference = 0;

    // Compare frames for motion detection - sample more pixels for better sensitivity
    for (let i = 0; i < currentData.length - 2; i += 2) { // Sample every 2nd pixel, ensure i+2 is in bounds
      const currentBrightness = (currentData[i] + currentData[i + 1] + currentData[i + 2]) / 3;
      const previousBrightness = (previousData[i] + previousData[i + 1] + previousData[i + 2]) / 3;
      
      const difference = Math.abs(currentBrightness - previousBrightness);
      totalDifference += difference;
      
      if (difference > 3) { // Even lower threshold for motion detection
        motionPixels++;
      }
      totalPixels++;
    }

    // Guard against division by zero
    if (totalPixels === 0) {
      return 0;
    }

    // Calculate average difference and motion ratio
    let avgDifference = totalDifference / totalPixels;
    let motionRatio = motionPixels / totalPixels;
    
    // Extra NaN guards
    if (isNaN(avgDifference) || isNaN(motionRatio)) {
      console.warn('NaN detected in motion calculation:', { avgDifference, motionRatio, totalPixels, totalDifference, motionPixels });
      avgDifference = 0;
      motionRatio = 0;
    }

    // Combine both metrics for better motion detection with higher sensitivity
    let motionScore = (motionRatio * 0.8) + (avgDifference / 255 * 0.2);
    if (isNaN(motionScore)) {
      console.warn('NaN detected in motionScore calculation:', { motionScore, avgDifference, motionRatio });
      motionScore = 0;
    }
    return motionScore;
  }

  private determineGesture(regions: any, motionScore: number): GestureState {
    // Extra NaN guard for motionScore
    if (isNaN(motionScore)) {
      console.warn('NaN motionScore passed to determineGesture, forcing to 0');
      motionScore = 0;
    }
    const centerBrightness = regions.center.brightness;
    const avgBrightness = (
      regions.center.brightness + 
      regions.left.brightness + 
      regions.right.brightness + 
      regions.top.brightness + 
      regions.bottom.brightness
    ) / 5;

    // Debug logging (occasionally)
    if (Math.random() < 0.01) {
      console.log('Simple detection:', {
        centerBrightness: centerBrightness.toFixed(2),
        avgBrightness: avgBrightness.toFixed(2),
        motionScore: motionScore.toFixed(4),
        gestureCounter: this.gestureCounter,
        noGestureCounter: this.noGestureCounter
      });
    }

    // Lowered thresholds for more sensitive detection
    if (motionScore > 0.0002 && centerBrightness > 15) { // Lowered motion and brightness thresholds
      // Any motion in center - likely hand gesture
      if (centerBrightness > 25) { // Lowered brightness threshold
        // Bright center - likely palm
        return {
          type: 'palm',
          confidence: Math.min(0.8, motionScore * 100),
          position: { x: 0.5, y: 0.5 }
        };
      } else {
        // Moderate brightness - likely pinch/pointing
        return {
          type: 'pinch',
          confidence: Math.min(0.7, motionScore * 100),
          position: { x: 0.5, y: 0.5 }
        };
      }
    } else if (motionScore > 0.0001) { // Lowered threshold
      // Very small motion - might be hand movement
      return {
        type: 'pinch',
        confidence: Math.min(0.5, motionScore * 100),
        position: { x: 0.5, y: 0.5 }
      };
    } else {
      // No significant motion - no gesture
      return {
        type: 'none',
        confidence: 0,
        position: { x: 0, y: 0 }
      };
    }
  }

  dispose(): void {
    this.isInitialized = false;
    this.previousFrame = null;
    this.gestureCounter = 0;
    this.noGestureCounter = 0;
  }
} 