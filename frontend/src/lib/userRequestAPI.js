import api from './api';

export const userRequestAPI = {
  create: (data) => api.post('/user-requests', data),
  getPending: () => api.get('/user-requests/pending'),
  approve: (id, adminNote) => api.put(`/user-requests/${id}/approve`, { adminNote }),
  reject: (id, adminNote) => api.put(`/user-requests/${id}/reject`, { adminNote })
};