import { Landmark, GestureType, GestureState, Point } from '../types/gestures';

const calculateDistance = (point1: Landmark, point2: Landmark): number => {
  return Math.sqrt(
    Math.pow(point1.x - point2.x, 2) + 
    Math.pow(point1.y - point2.y, 2)
  );
};

const getFingerTip = (landmarks: Landmark[], finger: number): Landmark => {
  const fingerTips = [4, 8, 12, 16, 20]; // Thumb, Index, Middle, Ring, Pinky
  return landmarks[fingerTips[finger]];
};

const getFingerPip = (landmarks: Landmark[], finger: number): Landmark => {
  const fingerPips = [3, 6, 10, 14, 18]; // Thumb, Index, Middle, Ring, Pinky
  return landmarks[fingerPips[finger]];
};

const getFingerMcp = (landmarks: Landmark[], finger: number): Landmark => {
  const fingerMcps = [2, 5, 9, 13, 17]; // Thumb, Index, Middle, Ring, Pinky
  return landmarks[fingerMcps[finger]];
};

const isFingerExtended = (landmarks: Landmark[], finger: number): boolean => {
  const tip = getFingerTip(landmarks, finger);
  const pip = getFingerPip(landmarks, finger);
  const mcp = getFingerMcp(landmarks, finger);
  
  // For thumb, check x-axis (horizontal), for others check y-axis (vertical)
  if (finger === 0) {
    // Thumb: check if tip is more extended than pip relative to mcp
    const tipExtension = Math.abs(tip.x - mcp.x);
    const pipExtension = Math.abs(pip.x - mcp.x);
    return tipExtension > pipExtension + 0.02;
  }
  
  // Other fingers: check if tip is above pip (lower y value means higher on screen)
  const tipExtension = mcp.y - tip.y;
  const pipExtension = mcp.y - pip.y;
  return tipExtension > pipExtension + 0.02;
};

const getExtendedFingerCount = (landmarks: Landmark[]): number => {
  return [0, 1, 2, 3, 4].filter(finger => isFingerExtended(landmarks, finger)).length;
};

export const detectGesture = (landmarks: Landmark[]): GestureState => {
  if (!landmarks || landmarks.length !== 21) {
    console.log('Invalid landmarks:', landmarks?.length);
    return { type: 'none', confidence: 0, position: { x: 0, y: 0 } };
  }

  const thumbTip = getFingerTip(landmarks, 0);
  const indexTip = getFingerTip(landmarks, 1);
  const middleTip = getFingerTip(landmarks, 2);
  const ringTip = getFingerTip(landmarks, 3);
  const pinkyTip = getFingerTip(landmarks, 4);
  const wrist = landmarks[0];

  // Calculate distances
  const thumbIndexDistance = calculateDistance(thumbTip, indexTip);
  const thumbMiddleDistance = calculateDistance(thumbTip, middleTip);
  const indexMiddleDistance = calculateDistance(indexTip, middleTip);

  // Get extended finger count
  const extendedFingers = getExtendedFingerCount(landmarks);

  console.log('Hand analysis:', {
    thumbIndexDistance: thumbIndexDistance.toFixed(3),
    extendedFingers,
    thumbTip: { x: thumbTip.x.toFixed(3), y: thumbTip.y.toFixed(3) },
    indexTip: { x: indexTip.x.toFixed(3), y: indexTip.y.toFixed(3) }
  });

  // Check for pinch gesture (thumb and index finger close, others closed)
  if (thumbIndexDistance < 0.04 && extendedFingers <= 1) {
    const confidence = Math.max(0.4, 1 - thumbIndexDistance * 15);
    console.log('Pinch detected:', { distance: thumbIndexDistance.toFixed(3), confidence });
    return {
      type: 'pinch',
      confidence,
      position: {
        x: (thumbTip.x + indexTip.x) / 2,
        y: (thumbTip.y + indexTip.y) / 2
      }
    };
  }

  // Check for zoom gesture (thumb and middle finger extended, others closed)
  const thumbExtended = isFingerExtended(landmarks, 0);
  const middleExtended = isFingerExtended(landmarks, 2);
  const indexExtended = isFingerExtended(landmarks, 1);
  const ringExtended = isFingerExtended(landmarks, 3);
  const pinkyExtended = isFingerExtended(landmarks, 4);
  
  if (thumbExtended && middleExtended && !indexExtended && !ringExtended && !pinkyExtended) {
    console.log('Zoom detected');
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

  // Check for fist gesture (all fingers closed)
  if (extendedFingers === 0) {
    console.log('Fist detected');
    return {
      type: 'fist',
      confidence: 0.9,
      position: {
        x: landmarks[9].x, // Middle of hand
        y: landmarks[9].y
      }
    };
  }

  // Check for palm gesture (all fingers extended)
  if (extendedFingers >= 4) {
    console.log('Palm detected');
    return {
      type: 'palm',
      confidence: 0.8,
      position: {
        x: landmarks[9].x, // Middle of hand
        y: landmarks[9].y
      }
    };
  }

  // Check for pointing gesture (only index finger extended)
  if (extendedFingers === 1 && indexExtended) {
    console.log('Pointing detected');
    return {
      type: 'pinch', // Use pinch for pointing too
      confidence: 0.4,
      position: {
        x: indexTip.x,
        y: indexTip.y
      }
    };
  }

  console.log('No specific gesture detected');
  return { type: 'none', confidence: 0, position: { x: 0, y: 0 } };
};