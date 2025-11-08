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
};

// Users API
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

// Attendance API
export const attendanceAPI = {
  mark: (type) => api.post('/attendance/mark', { type }),
  getToday: () => api.get('/attendance/today'),
  getByUser: (userId, params) => api.get(`/attendance/${userId}`, { params }),
};

// Leave API
export const leaveAPI = {
  apply: (leaveData) => api.post('/leave/apply', leaveData),
  getByUser: (userId, params) => api.get(`/leave/${userId}`, { params }),
  getAll: (params) => api.get('/leave/all', { params }),
  updateStatus: (id, status) => api.put(`/leave/approve/${id}`, { status }),
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