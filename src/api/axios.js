import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5026',
  //baseURL: "http://localhost:5026", // Haddii aad isticmaalayso horumarin maxalli ah, beddel URL-kan
  headers: {
    'Content-Type': 'application/json',
  },
});

const clearAuthStorage = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  localStorage.removeItem('role');
  localStorage.removeItem('user');
  localStorage.removeItem('userID');
};

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthStorage();
      window.location.href = '/';
    }

    return Promise.reject(error);
  },
);

export default api;