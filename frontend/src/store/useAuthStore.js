import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isInitialized: false,

  // Called on app load to check if user is already logged in via localStorage
  initAuth: () => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');
      
      if (storedUser && storedToken) {
        try {
          set({
            user: JSON.parse(storedUser),
            token: storedToken,
            isAuthenticated: true,
            isInitialized: true,
          });
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          set({ isInitialized: true });
        }
      } else {
        set({ isInitialized: true });
      }
    }
  },

  // Called after a successful login/register
  setAuth: (user, token) => set({ 
    user, 
    token, 
    isAuthenticated: true 
  }),

  // Called on logout
  clearAuth: () => set({ 
    user: null, 
    token: null, 
    isAuthenticated: false 
  }),
}));