import React, { useRef, useEffect, useCallback } from 'react';
import { Point, DrawingState } from '../types/gestures';

interface DrawingCanvasProps {
  drawingState: DrawingState;
  onDrawingStateChange: (state: DrawingState) => void;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  drawingState,
  onDrawingStateChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply transformations
    ctx.save();
    ctx.translate(drawingState.offset.x, drawingState.offset.y);
    ctx.scale(drawingState.scale, drawingState.scale);

    // Draw all paths
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 3 / drawingState.scale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    drawingState.paths.forEach(path => {
      if (path.length > 1) {
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) {
          ctx.lineTo(path[i].x, path[i].y);
        }
        ctx.stroke();
      }
    });

    // Draw current path
    if (drawingState.currentPath.length > 1) {
      ctx.strokeStyle = '#3b82f6';
      ctx.beginPath();
      ctx.moveTo(drawingState.currentPath[0].x, drawingState.currentPath[0].y);
      for (let i = 1; i < drawingState.currentPath.length; i++) {
        ctx.lineTo(drawingState.currentPath[i].x, drawingState.currentPath[i].y);
      }
      ctx.stroke();
    }

    ctx.restore();
  }, [drawingState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctxRef.current = ctx;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      redrawCanvas();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, [redrawCanvas]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const addPoint = useCallback((point: Point) => {
    onDrawingStateChange({
      ...drawingState,
      currentPath: [...drawingState.currentPath, point]
    });
  }, [drawingState, onDrawingStateChange]);

  const finishPath = useCallback(() => {
    if (drawingState.currentPath.length > 0) {
      onDrawingStateChange({
        ...drawingState,
        paths: [...drawingState.paths, drawingState.currentPath],
        currentPath: []
      });
    }
  }, [drawingState, onDrawingStateChange]);

  const eraseAtPoint = useCallback((point: Point) => {
    const eraseRadius = 50 / drawingState.scale;
    
    const filteredPaths = drawingState.paths.filter(path => {
      return !path.some(pathPoint => {
        const distance = Math.sqrt(
          Math.pow((pathPoint.x - point.x) / drawingState.scale, 2) +
          Math.pow((pathPoint.y - point.y) / drawingState.scale, 2)
        );
        return distance < eraseRadius;
      });
    });

    onDrawingStateChange({
      ...drawingState,
      paths: filteredPaths
    });
  }, [drawingState, onDrawingStateChange]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-10 pointer-events-none"
      style={{ 
        background: 'transparent',
        mixBlendMode: 'normal'
      }}
    />
  );
};