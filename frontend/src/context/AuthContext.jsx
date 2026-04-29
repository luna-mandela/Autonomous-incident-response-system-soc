import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you might have a /auth/me endpoint to verify the HttpOnly cookie
    // For this MVP, we will rely on localStorage just for the UI state (not for tokens).
    const storedUser = localStorage.getItem('airs_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const loginState = (userData) => {
    setUser(userData);
    localStorage.setItem('airs_user', JSON.stringify(userData));
  };

  const logoutState = () => {
    setUser(null);
    localStorage.removeItem('airs_user');
  };

  const value = {
    user,
    loginState,
    logoutState,
    loading
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};
