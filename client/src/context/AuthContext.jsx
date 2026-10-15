import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/services';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('skillsync_token');
    if (token) {
      authApi.getMe()
        .then((res) => setUser(res.data.user))
        .catch(() => {
          localStorage.removeItem('skillsync_token');
          localStorage.removeItem('skillsync_user');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authApi.login({ email, password });
    localStorage.setItem('skillsync_token', res.data.token);
    setUser(res.data.user);
    return res.data;
  }, []);

  const register = useCallback(async (data) => {
    const res = await authApi.register(data);
    localStorage.setItem('skillsync_token', res.data.token);
    setUser(res.data.user);
    return res.data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('skillsync_token');
    localStorage.removeItem('skillsync_user');
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
