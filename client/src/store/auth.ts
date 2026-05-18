import { create } from 'zustand';
import { api, getToken, setToken, User } from '../lib/api';

type AuthState = {
  user: User | null;
  loading: boolean;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: true,
  async initialize() {
    if (!getToken()) {
      set({ loading: false });
      return;
    }
    try {
      const { user } = await api.get<{ user: User }>('/auth/me');
      set({ user, loading: false });
    } catch {
      setToken(null);
      set({ user: null, loading: false });
    }
  },
  async login(email, password) {
    const { token, user } = await api.post<{ token: string; user: User }>('/auth/login', { email, password });
    setToken(token);
    set({ user });
  },
  async signup(name, email, password) {
    const { token, user } = await api.post<{ token: string; user: User }>('/auth/signup', { name, email, password });
    setToken(token);
    set({ user });
  },
  logout() {
    setToken(null);
    set({ user: null });
  },
}));
