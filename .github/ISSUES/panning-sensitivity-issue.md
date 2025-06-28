# Issue #1: Panning Sensitivity and Movement Detection

## Status
- **Current Status**: Partially resolved
- **Priority**: Medium
- **Assigned**: Unassigned
- **Created**: [Current Date]

## Description
Panning movement can be inconsistent with small hand movements. Users report that the canvas doesn't respond smoothly to palm gesture movements, especially for small or subtle movements.

## Technical Details
- **Root Cause**: Gesture detection frequency and coordinate mapping issues
- **Affected Component**: `App.tsx` - panning logic in `handleGestureDetected`
- **Related Files**: 
  - `src/App.tsx` (lines 100-160)
  - `src/components/CameraView.tsx` (gesture detection)

## Symptoms
- Small palm movements don't translate to canvas panning
- Panning feels "sticky" or unresponsive
- Console logs show "No significant movement detected - deltas too small"
- Deltas are calculated as 0.0 even when hand is moving

## Current Workaround
- Make deliberate, larger palm movements for better panning control
- Ensure good lighting for accurate hand tracking
- Use clear palm gesture (all fingers extended)

## Proposed Solutions
1. **Remove movement threshold** ✅ (Implemented)
   - Remove the 0.1 pixel threshold for panning
   - Allow any movement to be applied

2. **Improve gesture detection frequency**
   - Increase MediaPipe frame rate
   - Optimize gesture recognition interval

3. **Enhance coordinate mapping**
   - Improve screen-to-canvas coordinate transformation
   - Add movement smoothing for panning

## Testing
- [ ] Test with various hand movement speeds
- [ ] Test in different lighting conditions
- [ ] Test with different camera resolutions
- [ ] Verify smooth panning response

## Related Issues
- None currently

## Notes
- This issue affects the core user experience
- Priority should be given to smooth, responsive panning
- Consider adding visual feedback for panning state 