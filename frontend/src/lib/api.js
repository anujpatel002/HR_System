import axios from 'axios';

// Use Next.js proxy instead of direct backend URL
// This avoids CORS issues and keeps backend URL hidden
const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Token is automatically sent via httpOnly cookie with withCredentials: true
    // No need to manually add Authorization header
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token is in httpOnly cookie, will be cleared by backend on logout
      if (error.response?.data?.error?.includes('terminated')) {
        alert('Your session has been terminated by an administrator.');
      }
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data)
};

// Users API
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  bulkUpdate: (data) => api.post('/users/bulk-update', data)
};

// Attendance API
export const attendanceAPI = {
  mark: (type, userId = null) => api.post('/attendance/mark', { type, userId }),
  bulkMark: (data) => api.post('/attendance/bulk-mark', data),
  getToday: (userId = null) => api.get('/attendance/today', { params: userId ? { userId } : {} }),
  getByUser: (userId, params) => api.get(`/attendance/${userId}`, { params }),
  getSummary: (userId, params) => api.get(`/attendance/summary/${userId}`, { params }),
  exportCSV: (userId, params) => api.get(`/attendance/${userId}`, { params: { ...params, limit: 10000 } })
};

// Leave API
export const leaveAPI = {
  apply: (leaveData) => api.post('/leave/apply', leaveData),
  getByUser: (userId, params) => api.get(`/leave/${userId}`, { params }),
  getAll: (params) => api.get('/leave/all', { params }),
  updateStatus: (id, status) => api.put(`/leave/approve/${id}`, { status }),
  getBalance: (userId) => api.get(`/leave/balance/${userId}`),
  cancel: (id) => api.patch(`/leave/${id}/cancel`),
  exportCSV: (userId, params) => api.get(`/leave/${userId}`, { params: { ...params, limit: 10000 } })
};

// Payroll API
export const payrollAPI = {
  generate: (data) => api.post('/payroll/generate', data),
  getByUser: (userId, params) => api.get(`/payroll/${userId}`, { params }),
  getAll: (params) => api.get('/payroll/all', { params }),
  getStats: () => api.get('/payroll/stats'),
};

// Analytics API
export const analyticsAPI = {
  getAnalytics: () => api.get('/analytics'),
};

export default api;