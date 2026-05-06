import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import i18n from '../i18n';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const applyUser = useCallback((u) => {
    setUser(u);
    if (u?.language) {
      i18n.changeLanguage(u.language);
      localStorage.setItem('lang', u.language);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { setLoading(false); return; }
    api.get('/auth/me')
      .then(({ data }) => applyUser(data.user))
      .catch(() => localStorage.removeItem('access_token'))
      .finally(() => setLoading(false));
  }, [applyUser]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    applyUser(data.user);
    return data.user;
  };

  const register = async (name, email, password, language) => {
    const { data } = await api.post('/auth/register', { name, email, password, language });
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    applyUser(data.user);
    return data.user;
  };

  const logout = async () => {
    const refresh_token = localStorage.getItem('refresh_token');
    try { await api.post('/auth/logout', { refresh_token }); } catch {}
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  const updateUser = (updates) => setUser(prev => ({ ...prev, ...updates }));

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
