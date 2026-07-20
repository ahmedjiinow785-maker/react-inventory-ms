import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

const applyDarkMode = (enabled) => {
  if (enabled) {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }
};

export const AuthProvider = ({ children }) => {
  const [username, setUsername] = useState(() => localStorage.getItem('username') || '');
  const [role, setRole] = useState(() => localStorage.getItem('role') || '');
  const [userID, setUserID] = useState(() => localStorage.getItem('userID') || '');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchMe = useCallback(async () => {
    const response = await api.get('/api/auth/me');
    const { userID: id, username: name, role: userRole } = response.data;

    setUsername(name || '');
    setRole(userRole || '');
    setUserID(String(id || ''));

    localStorage.setItem('username', name || '');
    localStorage.setItem('role', userRole || '');
    localStorage.setItem('userID', String(id || ''));

    return response.data;
  }, []);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('token');
      applyDarkMode(localStorage.getItem('darkMode') === 'true');

      if (token) {
        try {
          await fetchMe();
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('username');
          localStorage.removeItem('role');
          localStorage.removeItem('userID');
          localStorage.removeItem('user');
        }
      }

      setLoading(false);
    };

    init();
  }, [fetchMe]);

  const login = (token, name, userRole) => {
    localStorage.setItem('token', token);
    localStorage.setItem('username', name);
    localStorage.setItem('role', userRole);
    localStorage.removeItem('user');

    setUsername(name);
    setRole(userRole);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    localStorage.removeItem('userID');
    localStorage.removeItem('user');

    setUsername('');
    setRole('');
    setUserID('');
  };

  const toggleDarkMode = () => {
    setDarkMode((current) => {
      const next = !current;
      localStorage.setItem('darkMode', String(next));
      applyDarkMode(next);
      return next;
    });
  };

  const value = useMemo(
    () => ({
      username,
      role,
      userID: userID ? Number(userID) : null,
      login,
      logout,
      fetchMe,
      darkMode,
      toggleDarkMode,
      sidebarOpen,
      setSidebarOpen,
      isAuthenticated: Boolean(localStorage.getItem('token') && username),
      loading,
    }),
    [darkMode, fetchMe, loading, role, sidebarOpen, userID, username],
  );

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
