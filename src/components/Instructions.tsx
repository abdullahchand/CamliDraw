import React, { useState } from 'react';
import { X, Hand, Circle, ZoomIn, Square } from 'lucide-react';

export const Instructions: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed top-6 right-6 z-50 px-4 py-2 bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-lg text-gray-300 hover:text-white transition-colors"
      >
        Show Help
      </button>
    );
  }

  return (
    <div className="fixed top-6 right-6 z-50 max-w-sm">
      <div className="bg-gray-900/90 backdrop-blur-md border border-gray-700/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Gesture Controls</h3>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500/20 border border-blue-400/30 rounded-lg flex items-center justify-center">
              <Circle className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-white text-sm font-medium">Pinch to Draw</p>
              <p className="text-gray-400 text-xs">Touch thumb and index finger</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500/20 border border-green-400/30 rounded-lg flex items-center justify-center">
              <Hand className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <p className="text-white text-sm font-medium">Palm to Pan</p>
              <p className="text-gray-400 text-xs">Show open palm to move canvas</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-500/20 border border-purple-400/30 rounded-lg flex items-center justify-center">
              <ZoomIn className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <p className="text-white text-sm font-medium">Two Fingers to Zoom</p>
              <p className="text-gray-400 text-xs">Thumb and middle finger extended</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-500/20 border border-red-400/30 rounded-lg flex items-center justify-center">
              <Square className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <p className="text-white text-sm font-medium">Fist to Erase</p>
              <p className="text-gray-400 text-xs">Close all fingers into fist</p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-700/50">
          <p className="text-gray-400 text-xs">
            Make sure your hand is clearly visible to the camera for best results.
          </p>
        </div>
      </div>
    </div>
  );
};