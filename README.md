# CamliDraw - Hand Gesture Drawing App

A real-time hand gesture-based drawing application that allows you to create sketches and diagrams using just your hands and a webcam. Think of it as **Excalidraw, but controlled entirely with hand gestures** - perfect for users without touch screens or those who prefer gesture-based interaction.

## 🎯 Problem Statement

Many drawing and diagramming tools require touch screens or expensive drawing tablets for natural input. This creates a barrier for users who:
- Don't have touch-enabled devices
- Prefer gesture-based interaction
- Want to draw naturally without additional hardware
- Are looking for a more accessible drawing solution

CamliDraw solves this by using computer vision and hand tracking to translate your hand movements into precise drawing strokes, making digital drawing accessible to everyone with just a webcam.

## ✨ Features

- **Real-time Hand Tracking**: Uses MediaPipe Hands for accurate hand landmark detection
- **Multiple Gestures**:
  - **Pinch** (thumb + index finger): Draw lines
  - **Palm** (open hand): Pan/scroll the canvas
  - **Fist** (closed hand): Erase drawings
  - **Zoom** (thumb + middle finger): Zoom in/out
- **Smooth Drawing**: Advanced smoothing algorithms reduce jitter and create clean lines
- **Mirror Display**: Camera feed is mirrored for intuitive drawing experience
- **Responsive Design**: Works on any screen size with automatic canvas scaling
- **Real-time Feedback**: Visual hand tracking overlay shows detected gestures

## 🚀 Quick Start

### Prerequisites

- Modern web browser with WebRTC support (Chrome, Firefox, Safari, Edge)
- Webcam for hand tracking
- Good lighting for accurate hand detection

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/camlidraw.git
   cd camlidraw
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173` and allow camera access when prompted.

### Usage

1. **Position your hand** in front of the camera with good lighting
2. **Make a pinch gesture** (thumb and index finger together) to start drawing
3. **Move your hand** to draw lines on the canvas
4. **Open your palm** to pan/scroll around the canvas
5. **Make a fist** to erase nearby drawings
6. **Use thumb + middle finger** to zoom in/out

## 🛠️ Technology Stack

- **Frontend**: React 18 with TypeScript
- **Hand Tracking**: MediaPipe Hands API
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Canvas Rendering**: HTML5 Canvas API

## 🏗️ Project Structure

```
src/
├── components/
│   ├── CameraView.tsx      # Hand tracking and gesture detection
│   ├── DrawingCanvas.tsx   # Canvas rendering and drawing logic
│   ├── GestureIndicator.tsx # Visual gesture feedback
│   └── ControlPanel.tsx    # UI controls and settings
├── types/
│   └── index.ts           # TypeScript type definitions
├── utils/
│   └── coordinates.ts     # Coordinate transformation utilities
└── App.tsx               # Main application component
```

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Install dependencies: `npm install`
4. Start development server: `npm run dev`
5. Make your changes and test thoroughly
6. Commit your changes: `git commit -m 'Add amazing feature'`
7. Push to the branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

### Areas for Contribution

- **Gesture Recognition**: Improve accuracy and add new gestures
- **Drawing Algorithms**: Enhance line smoothing and stroke quality
- **UI/UX**: Improve the interface and user experience
- **Performance**: Optimize hand tracking and rendering
- **Accessibility**: Add features for users with different abilities
- **Documentation**: Improve guides and examples

### Code Style

- Use TypeScript for all new code
- Follow existing code formatting (Prettier)
- Add comments for complex logic
- Write meaningful commit messages
- Test your changes thoroughly

## 🐛 Known Issues

### [Issue #1] Panning Sensitivity
- **Status**: Partially resolved
- **Description**: Panning movement can be inconsistent with small hand movements
- **Workaround**: Make deliberate palm movements for better panning control
- **Technical Details**: Related to gesture detection frequency and coordinate mapping

### [Issue #2] Gesture Conflicts
- **Status**: Under investigation
- **Description**: Some gestures may be confused with each other
- **Workaround**: Use clear, distinct hand positions for each gesture
- **Future**: Implement gesture confidence thresholds and context awareness

## 🗺️ Roadmap

- [ ] Smoothen the current implementation to feel intuitive and not buggy.
- [ ] Have smoother line sepration.
- [ ] Add more gesture types (circle, rectangle, etc.)
- [ ] Implement undo/redo functionality
- [ ] Add drawing tools (brush sizes, colors)
- [ ] Export drawings to various formats
- [ ] Collaborative drawing features
- [ ] Mobile device optimization
- [ ] Offline support with service workers

---

**Made with ❤️ for the open-source community** 