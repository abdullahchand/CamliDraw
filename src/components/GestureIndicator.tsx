import React from 'react';
import { Hand, Move, ZoomIn, Eraser, Circle } from 'lucide-react';
import { GestureState } from '../types/gestures';

interface GestureIndicatorProps {
  gesture: GestureState;
}

export const GestureIndicator: React.FC<GestureIndicatorProps> = ({ gesture }) => {
  const getGestureIcon = () => {
    switch (gesture.type) {
      case 'pinch':
        return <Circle className="w-5 h-5" />;
      case 'palm':
        return <Hand className="w-5 h-5" />;
      case 'zoom':
        return <ZoomIn className="w-5 h-5" />;
      case 'fist':
        return <Eraser className="w-5 h-5" />;
      default:
        return <Move className="w-5 h-5" />;
    }
  };

  const getGestureLabel = () => {
    switch (gesture.type) {
      case 'pinch':
        return 'Drawing';
      case 'palm':
        return 'Panning';
      case 'zoom':
        return 'Zooming';
      case 'fist':
        return 'Erasing';
      default:
        return 'No gesture';
    }
  };

  const getGestureColor = () => {
    switch (gesture.type) {
      case 'pinch':
        return 'text-blue-400 bg-blue-500/20 border-blue-400/30';
      case 'palm':
        return 'text-green-400 bg-green-500/20 border-green-400/30';
      case 'zoom':
        return 'text-purple-400 bg-purple-500/20 border-purple-400/30';
      case 'fist':
        return 'text-red-400 bg-red-500/20 border-red-400/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-400/30';
    }
  };

  return (
    <div className="fixed top-6 left-6 z-50">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl backdrop-blur-md border ${getGestureColor()} transition-all duration-300`}>
        {getGestureIcon()}
        <div>
          <p className="font-semibold text-sm">{getGestureLabel()}</p>
          <p className="text-xs opacity-70">
            Confidence: {Math.round(gesture.confidence * 100)}%
          </p>
        </div>
      </div>
    </div>
  );
};