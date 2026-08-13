import api from '../api/axiosInstance';

/**
 * Login user and store authentication details in sessionStorage
 */
export const login = async (username, password) => {
  const response = await api.post('/auth/login', { username, password });
  
  if (response.data && response.data.token) {
    sessionStorage.setItem('token', response.data.token);
    sessionStorage.setItem('user', JSON.stringify(response.data.user));
  }
  
  return response.data;
};

/**
 * Clear authentication state from sessionStorage
 */
export const logout = () => {
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
  sessionStorage.clear();
};

/**
 * Retrieve stored JWT token
 */
export const getToken = () => {
  return sessionStorage.getItem('token');
};

/**
 * Retrieve stored user object
 */
export const getCurrentUser = () => {
  const userStr = sessionStorage.getItem('user');
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
