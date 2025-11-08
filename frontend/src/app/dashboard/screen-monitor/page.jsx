'use client';

import { useState, useEffect } from 'react';
import { Monitor, Eye, RefreshCw } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { isAdmin } from '../../../utils/roleGuards';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

export default function ScreenMonitorPage() {
  const { user } = useAuth();
  const [userScreens, setUserScreens] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [screenshot, setScreenshot] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (!user || !isAdmin(user.role)) return;
    fetchUserScreens();
    const interval = setInterval(fetchUserScreens, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchUserScreens = async () => {
    try {
      const response = await api.get('/screen-monitor/active');
      setUserScreens(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch user screens:', error);
    }
  };

  const fetchScreenshot = async (userId) => {
    try {
      console.log('Fetching screenshot for user:', userId);
      const response = await api.get(`/screen-monitor/screenshot/${userId}`);
      console.log('Screenshot response:', response.data);
      setScreenshot(response.data.data.screenshot);
    } catch (error) {
      console.log('No screenshot available for user:', userId, error.response?.status);
      setScreenshot(null);
    }
  };

  const requestScreenShare = async (userId) => {
    try {
      await api.post(`/screen-monitor/request/${userId}`);
      toast.success('Screen share request sent to user');
    } catch (error) {
      toast.error('Failed to send request');
    }
  };

  useEffect(() => {
    if (selectedUser) {
      fetchScreenshot(selectedUser.userId);
      const interval = setInterval(() => fetchScreenshot(selectedUser.userId), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedUser]);

  const getScreenData = (session) => {
    try {
      return session.attendanceStatus ? JSON.parse(session.attendanceStatus) : null;
    } catch {
      return null;
    }
  };

  if (!user || !isAdmin(user.role)) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">Only administrators can view screen monitoring.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Screen Monitor</h1>
          <p className="text-gray-600">Real-time view of user screens and activities</p>
        </div>
        <button
          onClick={fetchUserScreens}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Active Users ({userScreens.length})</h2>
          </div>
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {userScreens.map((session) => {
              const screenData = getScreenData(session);
              return (
                <div
                  key={session.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 ${
                    selectedUser?.id === session.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                  onClick={() => setSelectedUser(session)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{session.user.name}</h3>
                      <p className="text-sm text-gray-600">{session.user.role}</p>
                      {screenData && (
                        <p className="text-xs text-gray-500 mt-1">
                          Current: {screenData.currentPage || 'Unknown'}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <Eye className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedUser ? `${selectedUser.user.name}'s Screen` : 'Select a User'}
            </h2>
          </div>
          <div className="p-6">
            {selectedUser ? (
              <div className="space-y-4">
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
                  <div>User: {selectedUser.user.name}</div>
                  <div>Role: {selectedUser.user.role}</div>
                  <div>Login: {new Date(selectedUser.loginTime).toLocaleString()}</div>
                  <div>Last Activity: {new Date(selectedUser.lastActivity).toLocaleString()}</div>
                  {(() => {
                    const screenData = getScreenData(selectedUser);
                    return screenData ? (
                      <>
                        <div>Current Page: {screenData.currentPage}</div>
                        <div>URL: {screenData.screenData?.url}</div>
                        <div>Title: {screenData.screenData?.title}</div>
                      </>
                    ) : (
                      <div>No screen data available</div>
                    );
                  })()}
                </div>
                
                <div className="bg-gray-100 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-gray-900">Live Screen View</h4>
                    {screenshot && (
                      <button
                        onClick={() => setFullscreen(true)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        Fullscreen
                      </button>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    User ID: {selectedUser.userId} | Screenshot: {screenshot ? 'Available' : 'None'}
                  </div>
                  <div className="bg-white border-2 border-gray-300 rounded-lg h-96 flex items-center justify-center overflow-hidden">
                    {screenshot ? (
                      <img 
                        src={screenshot} 
                        alt="User Screen" 
                        className="max-w-full max-h-full object-contain cursor-pointer"
                        onClick={() => setFullscreen(true)}
                      />
                    ) : (
                      <div className="text-center text-gray-500">
                        <Monitor className="h-12 w-12 mx-auto mb-2" />
                        <p>No screen share active</p>
                        <button
                          onClick={() => requestScreenShare(selectedUser.userId)}
                          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Request Screen Share
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-12">
                <Monitor className="h-12 w-12 mx-auto mb-4" />
                <p>Select a user to monitor their screen</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Fullscreen Modal */}
      {fullscreen && screenshot && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <img 
              src={screenshot} 
              alt="User Screen Fullscreen" 
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={() => setFullscreen(false)}
              className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}