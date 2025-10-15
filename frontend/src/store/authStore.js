import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';

const extractUserFromPayload = (payload) => {
  if (!payload) return null;
  if (payload.data?.user) return payload.data.user;
  if (payload.data && !payload.data.user) return payload.data;
  if (payload.user) return payload.user;
  return null;
};

const extractTokenFromPayload = (payload) => {
  if (!payload) return null;
  if (payload.data?.token) return payload.data.token;
  if (payload.token) return payload.token;
  return null;
};

const persistUserLocally = (user) => {
  if (!user) {
    localStorage.removeItem('user');
    return;
  }
  try {
    localStorage.setItem('user', JSON.stringify(user));
  } catch (error) {
    console.warn('Failed to persist user payload', error);
  }
};

/**
 * Authentication Store using Zustand
 * Implements State Management Pattern
 */
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const payload = await api.post('/auth/login', { email, password });
          const user = extractUserFromPayload(payload);
          const token = extractTokenFromPayload(payload);

          if (!user || !token) {
            throw new Error('Invalid login response');
          }

          localStorage.setItem('token', token);
          persistUserLocally(user);
          set({ user, token, isLoading: false });
          return { success: true, user };
        } catch (error) {
          const errorMessage = error?.message || 'Login failed';
          set({ error: errorMessage, isLoading: false });
          return { success: false, error: errorMessage };
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const payload = await api.post('/auth/register', userData);
          const user = extractUserFromPayload(payload);
          const token = extractTokenFromPayload(payload);

          if (!user || !token) {
            throw new Error('Invalid registration response');
          }

          localStorage.setItem('token', token);
          persistUserLocally(user);
          set({ user, token, isLoading: false });
          return { success: true, user };
        } catch (error) {
          const errorMessage = error?.message || 'Registration failed';
          set({ error: errorMessage, isLoading: false });
          return { success: false, error: errorMessage };
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, token: null });
      },

      getCurrentUser: async () => {
        const { token } = get();
        if (!token) return null;
        try {
          const payload = await api.get('/auth/me');
          const user = extractUserFromPayload(payload);
          if (!user) return null;
          persistUserLocally(user);
          set({ user });
          return user;
        } catch (error) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          set({ user: null, token: null });
          return null;
        }
      },

      updateProfile: async ({ profile, guideInfo, avatarFile }) => {
        try {
          const formData = new FormData();
          if (profile) {
            formData.append('profile', JSON.stringify(profile));
          }
          if (guideInfo) {
            formData.append('guideInfo', JSON.stringify(guideInfo));
          }
          if (avatarFile) {
            formData.append('avatar', avatarFile);
          }

          const payload = await api.put('/auth/profile', formData);
          const user = extractUserFromPayload(payload);
          if (!user) {
            throw new Error('Profile update did not return user data');
          }

          persistUserLocally(user);
          set({ user });
          return { success: true, user };
        } catch (error) {
          const errorMessage = error?.message || 'Profile update failed';
          return { success: false, error: errorMessage };
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);
