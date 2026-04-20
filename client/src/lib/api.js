import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('engishu_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config?.url?.startsWith('/public')) {
      localStorage.removeItem('engishu_token');
      localStorage.removeItem('engishu_user');
      if (window.location.pathname.startsWith('/dashboard') || window.location.pathname.startsWith('/clients') ||
          window.location.pathname.startsWith('/leads') || window.location.pathname.startsWith('/policies') ||
          window.location.pathname.startsWith('/quotations') || window.location.pathname.startsWith('/documents') ||
          window.location.pathname.startsWith('/commissions') || window.location.pathname.startsWith('/tasks') ||
          window.location.pathname.startsWith('/settings')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
