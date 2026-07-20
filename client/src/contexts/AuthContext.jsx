import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api, { setAccessToken, registerLogoutHandler } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(async (silent = false) => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore - we clear local state regardless
    }
    setAccessToken(null);
    setUser(null);
    if (!silent) toast.success('Logged out successfully');
  }, []);

  useEffect(() => {
    registerLogoutHandler(() => logout(true));
  }, [logout]);

  // Attempt silent refresh on first load so a page reload keeps the user logged in.
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const { data } = await api.post('/auth/refresh-token');
        setAccessToken(data.data.accessToken);
        setUser(data.data.user);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    bootstrap();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setAccessToken(data.data.accessToken);
    setUser(data.data.user);
    return data.data.user;
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    return data;
  };

  const refreshMe = async () => {
    const { data } = await api.get('/auth/me');
    setUser(data.data);
    return data.data;
  };

  return (
    <AuthContext.Provider value={{ user, setUser, isLoading, login, register, logout, refreshMe }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
