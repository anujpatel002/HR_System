import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

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
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
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
  getAll: () => api.get('/users'),
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

export default api;