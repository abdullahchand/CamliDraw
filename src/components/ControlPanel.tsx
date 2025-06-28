import React from 'react';
import { RotateCcw, Maximize2, Minimize2 } from 'lucide-react';
import { DrawingState } from '../types/gestures';

interface ControlPanelProps {
  drawingState: DrawingState;
  onClearCanvas: () => void;
  onResetView: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  drawingState,
  onClearCanvas,
  onResetView
}) => {
  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="flex items-center gap-3 px-6 py-4 bg-gray-900/80 backdrop-blur-md border border-gray-700/50 rounded-2xl">
        <button
          onClick={onClearCanvas}
          className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 rounded-lg transition-all duration-200 text-red-400 hover:text-red-300"
        >
          <RotateCcw className="w-4 h-4" />
          Clear
        </button>
        
        <button
          onClick={onResetView}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded-lg transition-all duration-200 text-blue-400 hover:text-blue-300"
        >
          <Maximize2 className="w-4 h-4" />
          Reset View
        </button>

        <div className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 rounded-lg">
          <span className="text-gray-300 text-sm">
            Zoom: {Math.round(drawingState.scale * 100)}%
          </span>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 rounded-lg">
          <span className="text-gray-300 text-sm">
            Paths: {drawingState.paths.length}
          </span>
        </div>
      </div>
    </div>
  );
};