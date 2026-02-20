// frontend/utils/api.js
import axios from 'axios';

export const fetchUsers = async (page, searchTerm) => {
  const token = localStorage.getItem('token');
  const res = await axios.get('/api/users', {
    headers: { Authorization: `Bearer ${token}` },
    params: { page, limit: 10, searchTerm },
  });
  return res.data;
};
