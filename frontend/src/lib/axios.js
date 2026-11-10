import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

const baseURL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/+$/, '');

const api = axios.create({
  baseURL: `${baseURL}/`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshPromise;

function isAuthEndpoint(url = '') {
  return /\/auth\/(?:login|register|refresh|logout)(?:[/?]|$)/i.test(url);
}

function saveSession(session) {
  if (!session?.accessToken) {
    const error = new Error('Authentication response did not include an access token.');
    error.code = 'INVALID_AUTH_RESPONSE';
    throw error;
  }

  localStorage.setItem('token', session.accessToken);
  if (session.user) {
    localStorage.setItem('user', JSON.stringify(session.user));
  }
  useAuthStore.getState().setAuth(session.user || null, session.accessToken);
  return session.accessToken;
}

function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  useAuthStore.getState().clearAuth();
}

function responseData(response) {
  return response.data?.data ?? response.data;
}

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.set('Authorization', `Bearer ${token}`);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (
      error.response?.status !== 401 ||
      typeof window === 'undefined' ||
      !config ||
      config._authRetry ||
      isAuthEndpoint(config.url)
    ) {
      return Promise.reject(error);
    }

    config._authRetry = true;
    try {
      if (!refreshPromise) {
        refreshPromise = api
          .post('/auth/refresh')
          .then((response) => saveSession(responseData(response)))
          .finally(() => {
            refreshPromise = undefined;
          });
      }

      const token = await refreshPromise;
      config.headers.set('Authorization', `Bearer ${token}`);
      return api(config);
    } catch (refreshError) {
      if (
        refreshError.response?.status === 401 ||
        refreshError.response?.status === 403 ||
        refreshError.code === 'INVALID_AUTH_RESPONSE'
      ) {
        clearSession();
      }
      return Promise.reject(refreshError);
    }
  }
);

export default api;
