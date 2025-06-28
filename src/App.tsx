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

    setCurrentGesture(gesture);
    
    const lastGesture = lastGestureRef.current;
    const screenPoint = {
      x: gesture.position.x * window.innerWidth,
      y: gesture.position.y * window.innerHeight
    };

    // Handle drawing (pinch gesture)
    if (gesture.type === 'pinch' && gesture.confidence > 0.6) {
      const canvasPoint = screenToCanvas(gesture.position);
      
      if (!drawingState.isDrawing) {
        // Start new path
        setDrawingState(prev => ({
          ...prev,
          isDrawing: true,
          currentPath: [canvasPoint]
        }));
      } else {
        // Continue current path
        setDrawingState(prev => ({
          ...prev,
          currentPath: [...prev.currentPath, canvasPoint]
        }));
      }
    } else if (drawingState.isDrawing && gesture.type !== 'pinch') {
      // Finish drawing path with a delay to prevent flickering
      gestureTimeoutRef.current = window.setTimeout(() => {
        setDrawingState(prev => {
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
      }, 100);
    }

    // Handle panning (palm gesture)
    if (gesture.type === 'palm' && gesture.confidence > 0.7) {
      if (!drawingState.isPanning) {
        panStartRef.current = screenPoint;
        setDrawingState(prev => ({
          ...prev,
          isPanning: true
        }));
      } else if (panStartRef.current) {
        const deltaX = screenPoint.x - panStartRef.current.x;
        const deltaY = screenPoint.y - panStartRef.current.y;
        
        setDrawingState(prev => ({
          ...prev,
          offset: {
            x: prev.offset.x + deltaX,
            y: prev.offset.y + deltaY
          }
        }));
        
        panStartRef.current = screenPoint;
      }
    } else if (drawingState.isPanning && gesture.type !== 'palm') {
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

    // Handle erasing (fist gesture)
    if (gesture.type === 'fist' && gesture.confidence > 0.8) {
      const canvasPoint = screenToCanvas(gesture.position);
      
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
      // Flip x coordinate for mirrored camera
      const flippedPosition = { x: 1 - position.x, y: position.y };
      const canvasPoint = screenToCanvas(flippedPosition);
      setDrawingState(prev => {
        // Only add if not duplicate
        if (
          prev.currentPath.length === 0 ||
          prev.currentPath[prev.currentPath.length - 1].x !== canvasPoint.x ||
          prev.currentPath[prev.currentPath.length - 1].y !== canvasPoint.y
        ) {
          return {
            ...prev,
            isDrawing: true,
            currentPath: [...prev.currentPath, canvasPoint]
          };
        }
        return prev;
      });
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