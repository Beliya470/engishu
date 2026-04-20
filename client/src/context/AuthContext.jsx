import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('engishu_token');
    const saved = localStorage.getItem('engishu_user');
    if (token && saved) {
      setUser(JSON.parse(saved));
      // Verify token is still valid
      api.get('/auth/me').then(res => {
        setUser(res.data);
        localStorage.setItem('engishu_user', JSON.stringify(res.data));
      }).catch(() => {
        localStorage.removeItem('engishu_token');
        localStorage.removeItem('engishu_user');
        setUser(null);
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('engishu_token', res.data.token);
    localStorage.setItem('engishu_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('engishu_token');
    localStorage.removeItem('engishu_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
