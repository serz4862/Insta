import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isPhoneVerified: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setPhoneVerified: (verified: boolean) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isPhoneVerified: false,
  isLoading: true,
  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
    }),
  setPhoneVerified: (verified) => set({ isPhoneVerified: verified }),
  setLoading: (loading) => set({ isLoading: loading }),
  clearAuth: () =>
    set({
      user: null,
      isAuthenticated: false,
      isPhoneVerified: false,
      isLoading: false,
    }),
}));
