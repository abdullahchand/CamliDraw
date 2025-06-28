export interface Point {
  x: number;
  y: number;
}

export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export type GestureType = 'pinch' | 'palm' | 'zoom' | 'fist' | 'none';

export interface GestureState {
  type: GestureType;
  confidence: number;
  position: Point;
  distance?: number;
}

export interface DrawingState {
  isDrawing: boolean;
  isPanning: boolean;
  isZooming: boolean;
  isErasing: boolean;
  scale: number;
  offset: Point;
  currentPath: Point[];
  paths: Point[][];
}