import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import api from '../lib/api';

export const useScreenCapture = () => {
  const { user } = useAuth();
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!user || user.role === 'ADMIN') return;

    const checkAndStartCapture = async () => {
      try {
        // Check if screen share was accepted
        const response = await api.get('/screen-monitor/request');
        const request = response.data.data;
        
        console.log('Screen share request status:', request);
        
        if (request && request.status === 'accept' && !streamRef.current) {
          console.log('Starting screen capture - request accepted');
          await startScreenCapture();
        } else if (!request) {
          console.log('No screen share request found');
        } else if (request.status !== 'accept') {
          console.log('Request status is not accept:', request.status);
        } else if (streamRef.current) {
          console.log('Screen capture already running');
        }
      } catch (error) {
        console.log('Error checking screen share request:', error);
      }
    };

    const startScreenCapture = async () => {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { mediaSource: 'screen' },
          audio: false
        });
        
        streamRef.current = stream;
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const video = document.createElement('video');
        
        video.srcObject = stream;
        video.play();
        
        video.onloadedmetadata = () => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          const captureFrame = () => {
            if (streamRef.current) {
              ctx.drawImage(video, 0, 0);
              const imageData = canvas.toDataURL('image/jpeg', 0.5);
              
              api.post('/screen-monitor/screenshot', {
                userId: user.id,
                screenshot: imageData,
                timestamp: Date.now()
              }).then(() => {
                console.log('Screenshot sent successfully');
              }).catch((error) => {
                console.error('Failed to send screenshot:', error);
              });
            }
          };
          
          intervalRef.current = setInterval(captureFrame, 2000);
        };
        
      } catch (error) {
        console.error('Screen capture failed:', error);
      }
    };

    // Check every 3 seconds for accepted requests
    const checkInterval = setInterval(checkAndStartCapture, 3000);
    checkAndStartCapture();

    return () => {
      clearInterval(checkInterval);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [user]);
};