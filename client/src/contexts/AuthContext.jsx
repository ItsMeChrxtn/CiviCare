import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { setAccessToken, registerLogoutHandler } from '../utils/api';
import useIdleLogout, { IDLE_FLAG_KEY, markActivity, clearActivity, sessionExpiredWhileAway } from '../hooks/useIdleLogout';

const flagIdleLogout = () => {
  try {
    sessionStorage.setItem(IDLE_FLAG_KEY, '1');
  } catch {
    // storage unavailable: the login page just won't explain why
  }
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const logout = useCallback(async (silent = false) => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore - we clear local state regardless
    }
    setAccessToken(null);
    setUser(null);
    clearActivity();
    if (!silent) toast.success('Logged out successfully');
  }, []);

  useEffect(() => {
    registerLogoutHandler(() => logout(true));
  }, [logout]);

  // Attempt silent refresh on first load so a page reload keeps the user logged in.
  useEffect(() => {
    const bootstrap = async () => {
      // A session left idle past the limit (e.g. the browser was closed) is not restored.
      if (sessionExpiredWhileAway()) {
        flagIdleLogout();
        await logout(true);
        setIsLoading(false);
        return;
      }
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
  }, [logout]);

  // Panel revision: end an idle session automatically (with a one-minute warning).
  useIdleLogout(Boolean(user), async (reason) => {
    if (reason === 'manual') {
      await logout();
    } else {
      flagIdleLogout();
      await logout(true);
    }
    navigate('/login', { replace: true });
  });

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    markActivity();
    setAccessToken(data.data.accessToken);
    setUser(data.data.user);
    return data.data.user;
  };

  const register = async (payload) => {
    const isForm = payload instanceof FormData;
    const { data } = await api.post('/auth/register', payload, isForm ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined);
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
