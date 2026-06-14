import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize and check for existing tokens and profile
  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = localStorage.getItem('access_token');
      if (accessToken) {
        try {
          const response = await api.get('/api/accounts/me/');
          setUser(response.data);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Failed to verify token on load', error);
          // Token might be expired or invalid, clear local storage
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user_role');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await api.post('/api/auth/token/', { username, password });
      const { access, refresh, role, email, id, must_change_password } = response.data;
      
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user_role', role);

      const loggedInUser = { id, username, email, role, must_change_password };
      setUser(loggedInUser);
      setIsAuthenticated(true);
      
      return { success: true, user: loggedInUser };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.response?.data?.detail || 'Invalid username or password.' };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/api/accounts/register/', userData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.response?.data || { detail: 'Registration failed.' } };
    }
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      try {
        // Blacklist token in backend database
        await api.post('/api/accounts/logout/', { refresh: refreshToken });
      } catch (error) {
        console.error('Failed to blacklist token in backend', error);
      }
    }

    // Clear client-side state
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateMustChangePassword = (val) => {
    setUser(prev => prev ? { ...prev, must_change_password: val } : null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, register, logout, updateMustChangePassword }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

