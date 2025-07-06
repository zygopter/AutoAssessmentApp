// src/contexts/AuthContext.js

import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser } from '../services/api';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  console.log('🛠️ AuthContext v2 loaded');

  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[AuthContext] ⏰ Initializing auth…');
    // 1) Au montage, on restaure l'utilisateur si le token est encore valide
    const token = localStorage.getItem('token');
    console.log('[AuthContext] ▶️  token from localStorage:', token);
    if (token) {
      try {
        const decoded = jwtDecode(token);
        console.log('[AuthContext] decoded on mount:', decoded);
        if (decoded.exp * 1000 > Date.now()) {
          setUser(decoded.user);
          console.log('[AuthContext] 👍  User set from token:', decoded.user);
        } else {
          console.warn('[AuthContext] token expired on mount');
          localStorage.removeItem('token');
        }
      } catch (err) {
        console.error('[AuthContext] ❌ Invalid token, removing:', err);
        localStorage.removeItem('token');
      }
    } else {
      console.log('[AuthContext] ℹ️  No token found');
    }
    setLoading(false)

    // 2) On installe l'intervalle qui vérifie toutes les 30s
    const interval = setInterval(() => {
      const t = localStorage.getItem('token')
      if (t) {
        try {
          const { exp } = jwtDecode(t)
          if (exp * 1000 < Date.now()) {
            console.warn('[AuthContext] token expired via interval – logging out')
            logout()
            window.location.href = '/login'
          }
        } catch {
          // token malformé
          console.warn('[AuthContext] malformed token via interval – logging out')
          logout()
          window.location.href = '/login'
        }
      }
    }, 30_000) // toutes les 30 secondes

    return () => clearInterval(interval)
  }, [])

  const login = async (credentials) => {
    console.log('[AuthContext] 🚪 login() called:', credentials);
    try {
      const response = await loginUser(credentials);
      console.log('[AuthContext] 📨 loginUser response:', response);
      if (response?.token) {
        localStorage.setItem('token', response.token);
        console.log('[AuthContext] 💾 token saved');
        const decoded = jwtDecode(response.token);
        console.log('[AuthContext] 🔍 Decoded on login:', decoded);
        setUser(decoded.user);
        console.log('[AuthContext] 👤 User set after login:', decoded.user);
        return decoded.user;
      } else {
        throw new Error('No token in login response');
      }
    } catch (err) {
      console.error('[AuthContext] ❌ login error:', err);
      throw err;
    }
  };

  const register = async (userData) => {
    console.log('[AuthContext] 📝 register() called:', userData);
    try {
      const response = await registerUser(userData);
      console.log('[AuthContext] 📨 registerUser response:', response);
      if (response?.token) {
        localStorage.setItem('token', response.token);
        console.log('[AuthContext] 💾 token saved after register');
        const decoded = jwtDecode(response.token);
        console.log('[AuthContext] 🔍 Decoded on register:', decoded);
        setUser(decoded.user);
        console.log('[AuthContext] 👤 User set after register:', decoded.user);
        return decoded.user;
      } else {
        throw new Error('No token in register response');
      }
    } catch (err) {
      console.error('[AuthContext] ❌ register error:', err);
      throw err;
    }
  };

  const logout = () => {
    console.log('[AuthContext] 🔒 logout() called');
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export const AuthConsumer = ({ children }) => {
  const { user, loading, login, logout, register } = useAuth();
  console.log('[AuthConsumer] 🔄 Context update:', { user, loading });
  const isLoggedIn = !!user;
  return children({ isLoggedIn, user, loading, login, logout, register });
};
