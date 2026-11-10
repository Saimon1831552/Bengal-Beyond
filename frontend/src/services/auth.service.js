import api from '../lib/axios';
import { useAuthStore } from '../store/useAuthStore';

function responseData(response) {
  return response.data?.data ?? response.data;
}

function saveSession(session) {
  if (!session?.accessToken) {
    throw new Error('Authentication response did not include an access token.');
  }

  localStorage.setItem('token', session.accessToken);
  if (session.user) {
    localStorage.setItem('user', JSON.stringify(session.user));
  }
  useAuthStore.getState().setAuth(session.user || null, session.accessToken);
  return session;
}

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return saveSession(responseData(response));
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return saveSession(responseData(response));
  },

  refreshSession: async () => {
    const response = await api.post('/auth/refresh');
    return saveSession(responseData(response));
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      useAuthStore.getState().clearAuth();
    }
  },
};
