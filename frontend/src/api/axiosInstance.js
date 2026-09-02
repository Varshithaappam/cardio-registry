import axios from 'axios';

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Attach token and authenticated user headers to outgoing requests
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const storedUser = sessionStorage.getItem('user') || localStorage.getItem('user');
    if (storedUser) {
      try {
        const userObj = typeof storedUser === 'string' ? JSON.parse(storedUser) : storedUser;
        const userName = userObj.username || userObj.name || userObj.full_name || userObj.email;
        if (userName) {
          config.headers['X-User-Name'] = userName;
        }
        if (userObj.id || userObj.userId || userObj.user_id) {
          config.headers['X-User-Id'] = userObj.id || userObj.userId || userObj.user_id;
        }
        if (userObj.role || userObj.role_name) {
          config.headers['X-User-Role'] = userObj.role || userObj.role_name;
        }
      } catch (e) {
        config.headers['X-User-Name'] = storedUser;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Redirect to login when authentication is invalid
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401 || status === 403) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      sessionStorage.clear();

      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;