import React, { useState, useCallback, useRef, useEffect } from 'react';
import { CameraView } from './components/CameraView';
import { DrawingCanvas } from './components/DrawingCanvas';
import { GestureIndicator } from './components/GestureIndicator';
import { ControlPanel } from './components/ControlPanel';
import { Instructions } from './components/Instructions';
import { GestureState, DrawingState, Point } from './types/gestures';

function App() {
  const [currentGesture, setCurrentGesture] = useState<GestureState>({
    type: 'none',
    confidence: 0,
    position: { x: 0, y: 0 }
  });

  const [drawingState, setDrawingState] = useState<DrawingState>({
    isDrawing: false,
    isPanning: false,
    isZooming: false,
    isErasing: false,
    scale: 1,
    offset: { x: 0, y: 0 },
    currentPath: [],
    paths: []
  });

  const lastGestureRef = useRef<GestureState | null>(null);
  const lastZoomDistanceRef = useRef<number | null>(null);
  const panStartRef = useRef<Point | null>(null);
  const gestureTimeoutRef = useRef<number | null>(null);
  const lastGestureTypeRef = useRef<string | null>(null);
  const lastDrawPositionRef = useRef<Point | null>(null);
  const positionHistoryRef = useRef<Point[]>([]);
  const MIN_DISTANCE_THRESHOLD = 0.01;
  const SMOOTHING_WINDOW = 3;

  const screenToCanvas = useCallback((screenPoint: Point): Point => {
    return {
      x: (screenPoint.x * window.innerWidth - drawingState.offset.x) / drawingState.scale,
      y: (screenPoint.y * window.innerHeight - drawingState.offset.y) / drawingState.scale
    };
  }, [drawingState.offset, drawingState.scale]);

  const handleGestureDetected = useCallback((gesture: GestureState) => {
    // Clear any existing timeout
    if (gestureTimeoutRef.current) {
      window.clearTimeout(gestureTimeoutRef.current);
    }

    console.log('Gesture detected:', gesture.type, 'confidence:', gesture.confidence, 'isDrawing:', drawingState.isDrawing);

    setCurrentGesture(gesture);
    
    const lastGesture = lastGestureRef.current;
    const screenPoint = {
      x: gesture.position.x * window.innerWidth,
      y: gesture.position.y * window.innerHeight
    };

    // Handle drawing (pinch gesture)
    if (gesture.type === 'pinch' && gesture.confidence > 0.6) {
      console.log('Pinch gesture detected with confidence:', gesture.confidence);
      // Only set drawing state, don't add points here
      // Points will be added by handleHandPositionUpdate for smoother drawing
      if (!drawingState.isDrawing) {
        console.log('Starting new drawing session - clearing all state');
        // Clear all drawing state and start fresh
        setDrawingState(prev => {
          console.log('Previous currentPath length:', prev.currentPath.length);
          return {
            ...prev,
            isDrawing: true,
            currentPath: [] // Ensure completely empty path
          };
        });
        // Reset position tracking for new drawing session
        positionHistoryRef.current = [];
        lastDrawPositionRef.current = null;
        console.log('Drawing state reset complete');
      } else {
        console.log('Already drawing, continuing...');
      }
    } else if (drawingState.isDrawing && gesture.type !== 'pinch') {
      console.log('Stopping drawing - gesture changed to:', gesture.type);
      // Immediately stop drawing and finish the path
      setDrawingState(prev => {
        console.log('Finishing drawing path immediately, length:', prev.currentPath.length);
        if (prev.currentPath.length > 1) {
          return {
            ...prev,
            isDrawing: false,
            paths: [...prev.paths, prev.currentPath],
            currentPath: []
          };
        }
        return {
          ...prev,
          isDrawing: false,
          currentPath: []
        };
      });
    }

    // Reset gesture type when no gesture is detected
    if (gesture.type === 'none') {
      console.log('No gesture detected - resetting gesture type');
      lastGestureTypeRef.current = null;
    }

    // Handle panning (palm gesture)
    if (gesture.type === 'palm' && gesture.confidence > 0.7) {
      console.log('Palm gesture detected for panning, confidence:', gesture.confidence);
      // Flip x coordinate for mirrored camera (to match the visual display)
      const flippedPosition = { x: 1 - gesture.position.x, y: gesture.position.y };
      const flippedScreenPoint = {
        x: flippedPosition.x * window.innerWidth,
        y: flippedPosition.y * window.innerHeight
      };
      
      console.log('Panning coordinates:', {
        original: { x: gesture.position.x.toFixed(3), y: gesture.position.y.toFixed(3) },
        flipped: { x: flippedPosition.x.toFixed(3), y: flippedPosition.y.toFixed(3) },
        screenPoint: { x: flippedScreenPoint.x.toFixed(1), y: flippedScreenPoint.y.toFixed(1) },
        windowSize: { width: window.innerWidth, height: window.innerHeight }
      });
      
      if (!drawingState.isPanning) {
        console.log('Starting panning');
        panStartRef.current = flippedScreenPoint;
        setDrawingState(prev => ({
          ...prev,
          isPanning: true
        }));
      } else if (panStartRef.current) {
        const deltaX = flippedScreenPoint.x - panStartRef.current.x;
        const deltaY = flippedScreenPoint.y - panStartRef.current.y;
        
        console.log('Panning delta:', {
          deltaX: deltaX.toFixed(1),
          deltaY: deltaY.toFixed(1),
          startPoint: { x: panStartRef.current.x.toFixed(1), y: panStartRef.current.y.toFixed(1) },
          currentPoint: { x: flippedScreenPoint.x.toFixed(1), y: flippedScreenPoint.y.toFixed(1) },
          rawDeltaX: deltaX,
          rawDeltaY: deltaY
        });
        
        // Apply pan movement regardless of size
        console.log('Applying pan movement');
        setDrawingState(prev => ({
          ...prev,
          offset: {
            x: prev.offset.x + deltaX,
            y: prev.offset.y + deltaY
          }
        }));
        
        panStartRef.current = flippedScreenPoint;
      }
    } else if (drawingState.isPanning && gesture.type !== 'palm') {
      console.log('Stopping panning - gesture changed to:', gesture.type);
      setDrawingState(prev => ({
        ...prev,
        isPanning: false
      }));
      panStartRef.current = null;
    }

    // Handle zooming (two finger gesture)
    if (gesture.type === 'zoom' && gesture.distance && gesture.confidence > 0.7) {
      if (!drawingState.isZooming) {
        lastZoomDistanceRef.current = gesture.distance;
        setDrawingState(prev => ({
          ...prev,
          isZooming: true
        }));
      } else if (lastZoomDistanceRef.current) {
        const zoomFactor = gesture.distance / lastZoomDistanceRef.current;
        const newScale = Math.max(0.1, Math.min(5, drawingState.scale * zoomFactor));
        
        setDrawingState(prev => ({
          ...prev,
          scale: newScale
        }));
        
        lastZoomDistanceRef.current = gesture.distance;
      }
    } else if (drawingState.isZooming && gesture.type !== 'zoom') {
      setDrawingState(prev => ({
        ...prev,
        isZooming: false
      }));
      lastZoomDistanceRef.current = null;
    }

    // Handle erasing (fist gesture - closed hand)
    if (gesture.type === 'fist' && gesture.confidence > 0.8) {
      // Flip x coordinate for mirrored camera (to match the visual display)
      const flippedPosition = { x: 1 - gesture.position.x, y: gesture.position.y };
      const canvasPoint = screenToCanvas(flippedPosition);
      
      if (!drawingState.isErasing) {
        setDrawingState(prev => ({
          ...prev,
          isErasing: true
        }));
      }
      
      // Erase paths near the fist position
      const eraseRadius = 50 / drawingState.scale;
      setDrawingState(prev => ({
        ...prev,
        paths: prev.paths.filter(path => {
          return !path.some(point => {
            const distance = Math.sqrt(
              Math.pow(point.x - canvasPoint.x, 2) +
              Math.pow(point.y - canvasPoint.y, 2)
            );
            return distance < eraseRadius;
          });
        })
      }));
    } else if (drawingState.isErasing && gesture.type !== 'fist') {
      setDrawingState(prev => ({
        ...prev,
        isErasing: false
      }));
    }

    lastGestureRef.current = gesture;
    lastGestureTypeRef.current = gesture.type;
  }, [drawingState, screenToCanvas]);

  const handleClearCanvas = useCallback(() => {
    setDrawingState(prev => ({
      ...prev,
      paths: [],
      currentPath: []
    }));
  }, []);

  const handleResetView = useCallback(() => {
    setDrawingState(prev => ({
      ...prev,
      scale: 1,
      offset: { x: 0, y: 0 }
    }));
  }, []);

  const handleHandPositionUpdate = useCallback((position: Point | null) => {
    if (lastGestureTypeRef.current === 'pinch' && position) {
      // Add position to history for smoothing
      positionHistoryRef.current.push(position);
      if (positionHistoryRef.current.length > SMOOTHING_WINDOW) {
        positionHistoryRef.current.shift();
      }
      
      // Calculate smoothed position (average of recent positions)
      const smoothedPosition = {
        x: positionHistoryRef.current.reduce((sum, p) => sum + p.x, 0) / positionHistoryRef.current.length,
        y: positionHistoryRef.current.reduce((sum, p) => sum + p.y, 0) / positionHistoryRef.current.length
      };
      
      // Check minimum distance threshold
      if (lastDrawPositionRef.current) {
        const distance = Math.sqrt(
          Math.pow(smoothedPosition.x - lastDrawPositionRef.current.x, 2) +
          Math.pow(smoothedPosition.y - lastDrawPositionRef.current.y, 2)
        );
        
        // Only add point if moved enough distance
        if (distance < MIN_DISTANCE_THRESHOLD) {
          return;
        }
      }
      
      // Flip x coordinate for mirrored camera (to match the visual display)
      const flippedPosition = { x: 1 - smoothedPosition.x, y: smoothedPosition.y };
      const canvasPoint = screenToCanvas(flippedPosition);
      
      setDrawingState(prev => {
        // If this is the first point in a new drawing session, ensure path is empty
        if (prev.currentPath.length === 0) {
          console.log('Adding first point to new path:', canvasPoint);
          lastDrawPositionRef.current = smoothedPosition;
          return {
            ...prev,
            isDrawing: true,
            currentPath: [canvasPoint] // Start fresh path
          };
        }
        
        // Continue existing path only if not duplicate and path is not too long
        if (
          (prev.currentPath[prev.currentPath.length - 1].x !== canvasPoint.x ||
           prev.currentPath[prev.currentPath.length - 1].y !== canvasPoint.y) &&
          prev.currentPath.length < 1000 // Prevent infinite growth
        ) {
          console.log('Adding point to existing path, total points:', prev.currentPath.length + 1);
          lastDrawPositionRef.current = smoothedPosition;
          return {
            ...prev,
            isDrawing: true,
            currentPath: [...prev.currentPath, canvasPoint]
          };
        }
        return prev;
      });
    } else {
      // Clear position history when not drawing or when gesture type is null
      if (positionHistoryRef.current.length > 0) {
        console.log('Clearing position history - not drawing or gesture reset');
      }
      positionHistoryRef.current = [];
      lastDrawPositionRef.current = null;
    }
  }, [screenToCanvas]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (gestureTimeoutRef.current) {
        window.clearTimeout(gestureTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden relative">
      {/* Camera view with transparency */}
      <CameraView onGestureDetected={handleGestureDetected} onHandPositionUpdate={handleHandPositionUpdate} />
      
      {/* Glass overlay */}
      <div className="absolute inset-0 bg-gray-900/10 backdrop-blur-[1px] z-5"></div>
      
      {/* Drawing canvas */}
      <DrawingCanvas 
        drawingState={drawingState}
        onDrawingStateChange={setDrawingState}
      />
      
      {/* UI Components */}
      <GestureIndicator gesture={currentGesture} />
      <ControlPanel 
        drawingState={drawingState}
        onClearCanvas={handleClearCanvas}
        onResetView={handleResetView}
      />
      <Instructions />
      
      {/* App title */}
      <div className="fixed bottom-6 right-6 z-40">
        <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-lg px-4 py-2">
          <h1 className="text-white text-sm font-semibold">Gesture Draw</h1>
          <p className="text-gray-400 text-xs">Computer Vision Drawing Tool</p>
        </div>
      </div>
    </div>
  );
}

export default App;