import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';

/**
 * Authentication Store using Zustand
 * Implements State Management Pattern
 */
export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      // Login action
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/login', { email, password });
          const { user, token } = response.data;
          
          localStorage.setItem('token', token);
          set({ user, token, isLoading: false });
          return { success: true };
        } catch (error) {
          set({ error: error.message, isLoading: false });
          return { success: false, error: error.message };
        }
      },

      // Register action
      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/register', userData);
          const { user, token } = response.data;
          
          localStorage.setItem('token', token);
          set({ user, token, isLoading: false });
          return { success: true };
        } catch (error) {
          set({ error: error.message, isLoading: false });
          return { success: false, error: error.message };
        }
      },

      // Logout action
      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, token: null });
      },

      // Get current user
      getCurrentUser: async () => {
        try {
          const response = await api.get('/auth/me');
          set({ user: response.data });
        } catch (error) {
          set({ user: null, token: null });
        }
      },

      // Update profile
      updateProfile: async (profileData) => {
        try {
          const response = await api.put('/auth/profile', { profile: profileData });
          set({ user: response.data });
          return { success: true };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);
