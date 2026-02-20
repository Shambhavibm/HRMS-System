import axios from 'axios';

axios.defaults.baseURL = 'http://localhost:5001'; // Your backend port

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
