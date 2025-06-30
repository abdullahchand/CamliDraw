import { useEffect, useRef, useState } from 'react';

export interface CameraDevice {
  deviceId: string;
  label: string;
}

export const useCamera = (deviceId?: string) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const deviceIdRef = useRef(deviceId);
  useEffect(() => { deviceIdRef.current = deviceId; }, [deviceId]);

  // Enumerate cameras
  useEffect(() => {
    const getDevices = async () => {
      try {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices
          .filter((d) => d.kind === 'videoinput')
          .map((d) => ({ deviceId: d.deviceId, label: d.label || `Camera ${d.deviceId.slice(-4)}` }));
        setDevices(videoDevices);
      } catch (err) {
        setDevices([]);
      }
    };
    getDevices();
  }, []);

  useEffect(() => {
    console.log('[useCamera] useEffect triggered with deviceId:', deviceId);
    const startCamera = async () => {
      console.log('[useCamera] startCamera called with deviceId:', deviceIdRef.current);
      try {
        // Stop any existing stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        const constraints: MediaStreamConstraints = {
          video: {
            width: { ideal: 640, max: 1280 },
            height: { ideal: 480, max: 720 },
            frameRate: { ideal: 30, max: 60 },
            ...(deviceIdRef.current ? { deviceId: { exact: deviceIdRef.current } } : { facingMode: 'user' })
          }
        };

        console.log('[useCamera] Requesting camera with constraints:', constraints);
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        if (videoRef.current) {
          const currentDeviceId = deviceIdRef.current;
          console.log('[useCamera] Setting video stream for deviceId (inside if):', currentDeviceId);
          videoRef.current.srcObject = stream;
          const track = stream.getVideoTracks()[0];
          if (track) {
            console.log('[useCamera] Actual video track label:', track.label, 'deviceId:', track.getSettings().deviceId);
          }
          videoRef.current.onloadedmetadata = () => {
            setIsLoading(false);
            setError(null);
            console.log('[useCamera] onloadedmetadata for deviceId:', currentDeviceId);
          };
          videoRef.current.onerror = () => {
            setError('Video stream error occurred');
            setIsLoading(false);
            console.log('[useCamera] onerror for deviceId:', currentDeviceId);
          };
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(`Failed to access camera: ${errorMessage}. Please ensure camera permissions are granted.`);
        setIsLoading(false);
      }
    };

    setIsLoading(true);
    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
        });
        streamRef.current = null;
      }
    };
  }, [deviceId]);

  return { videoRef, isLoading, error, devices };
};