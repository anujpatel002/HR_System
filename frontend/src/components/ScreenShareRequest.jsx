'use client';

import { useState, useEffect } from 'react';
import { Monitor, X, Check } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function ScreenShareRequest() {
  const [request, setRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeStream, setActiveStream] = useState(null);

  useEffect(() => {
    const checkForRequests = async () => {
      try {
        const response = await api.get('/screen-monitor/request');
        const requestData = response.data.data;
        
        console.log('Screen share request check:', requestData);
        
        if (requestData && requestData.status === 'pending') {
          setRequest(requestData);
          setShowModal(true);
        }
      } catch (error) {
        // Ignore 404 errors (no request found)
        if (error.response?.status !== 404) {
          console.error('Failed to check requests:', error);
        }
      }
    };

    const interval = setInterval(checkForRequests, 3000);
    checkForRequests();
    
    return () => {
      clearInterval(interval);
      // Cleanup screen share on component unmount
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [activeStream]);

  const handleResponse = async (response) => {
    try {
      await api.post('/screen-monitor/respond', { response });
      toast.success(`Screen share ${response}ed`);
      setShowModal(false);
      setRequest(null);
      
      // Start screen capture immediately if accepted
      if (response === 'accept') {
        startScreenCapture();
      }
    } catch (error) {
      toast.error('Failed to respond');
    }
  };

  const startScreenCapture = async () => {
    try {
      // Check browser compatibility
      const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
      const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
      const isEdge = /Edg/.test(navigator.userAgent);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        if (isChrome) {
          toast.error('Please update Chrome to version 72 or higher for screen sharing');
        } else if (isFirefox) {
          toast.error('Please update Firefox to version 66 or higher for screen sharing');
        } else if (isEdge) {
          toast.error('Please update Edge to version 79 or higher for screen sharing');
        } else {
          toast.error('Screen sharing requires Chrome 72+, Firefox 66+, or Edge 79+');
        }
        return;
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });
      
      setActiveStream(stream);
      
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.muted = true;
      
      video.onloadedmetadata = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const captureFrame = () => {
          ctx.drawImage(video, 0, 0);
          const imageData = canvas.toDataURL('image/jpeg', 0.8);
          
          api.post('/screen-monitor/screenshot', {
            screenshot: imageData,
            timestamp: Date.now()
          }).then(() => {
            console.log('Screen shared successfully');
          }).catch(console.error);
        };
        
        setInterval(captureFrame, 1500);
      };
      
      toast.success('Screen sharing started - Admin can see your screen');
      
    } catch (error) {
      if (error.name === 'NotAllowedError') {
        toast.error('Screen sharing denied. Please click "Share" when prompted');
      } else if (error.name === 'NotSupportedError') {
        toast.error('Please update your browser: Chrome 72+, Firefox 66+, or Edge 79+');
      } else {
        toast.error('Screen sharing failed. Please use a desktop browser.');
      }
    }
  };

  if (!showModal || !request) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="text-center">
          <Monitor className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Screen Share Request</h2>
          <p className="text-gray-600 mb-6">
            Administrator is requesting to view your screen for monitoring purposes.
          </p>
          
          <div className="flex space-x-3">
            <button
              onClick={() => handleResponse('accept')}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center justify-center space-x-2"
            >
              <Check className="h-4 w-4" />
              <span>Accept</span>
            </button>
            <button
              onClick={() => handleResponse('deny')}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center justify-center space-x-2"
            >
              <X className="h-4 w-4" />
              <span>Deny</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}