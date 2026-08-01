import api from '../api/axiosInstance';

/**
 * Login user and store authentication details in localStorage
 */
export const login = async (username, password) => {
  const response = await api.post('/auth/login', { username, password });
  
  if (response.data && response.data.token) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }
  
  return response.data;
};

/**
 * Clear authentication state from localStorage
 */
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

/**
 * Retrieve stored JWT token
 */
export const getToken = () => {
  return localStorage.getItem('token');
};

/**
 * Retrieve stored user object
 */
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (e) {
    return null;
  }
};

/**
 * Check if current user session is active
 */
export const isAuthenticated = () => {
  return !!getToken();
};

export default {
  login,
  logout,
  getToken,
  getCurrentUser,
  isAuthenticated
};
