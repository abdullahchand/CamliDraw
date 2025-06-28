import { useEffect, useRef, useState } from 'react';

export const useCamera = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        // Stop any existing stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640, max: 1280 },
            height: { ideal: 480, max: 720 },
            facingMode: 'user',
            frameRate: { ideal: 30, max: 60 }
          }
        });

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          console.log('Stream set on video element', videoRef.current);
          
          videoRef.current.onloadedmetadata = () => {
            console.log('Video metadata loaded');
            setIsLoading(false);
            setError(null);
          };
          
          videoRef.current.onerror = () => {
            console.log('Video error');
            setError('Video stream error occurred');
            setIsLoading(false);
          };
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(`Failed to access camera: ${errorMessage}. Please ensure camera permissions are granted.`);
        setIsLoading(false);
      }
    };

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
        });
        streamRef.current = null;
      }
    };
  }, []);

  return { videoRef, isLoading, error };
};