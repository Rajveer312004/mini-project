import React, { createContext, useState, useContext, useEffect } from "react";
import { signin, signup, signout, getProfile, isAuthenticated } from "../services/publicAuthApi";

const PublicAuthContext = createContext();

export const usePublicAuth = () => {
  const context = useContext(PublicAuthContext);
  if (!context) {
    throw new Error("usePublicAuth must be used within a PublicAuthProvider");
  }
  return context;
};

export const PublicAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      if (isAuthenticated()) {
        const data = await getProfile();
        setUser(data.user);
        setIsAuth(true);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      signout();
      setUser(null);
      setIsAuth(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const data = await signin(email, password);
      setUser(data.user);
      setIsAuth(true);
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || "Sign in failed",
      };
    }
  };

  const register = async (userData) => {
    try {
      const data = await signup(userData);
      setUser(data.user);
      setIsAuth(true);
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || "Registration failed",
      };
    }
  };

  const logout = () => {
    signout();
    setUser(null);
    setIsAuth(false);
  };

  return (
    <PublicAuthContext.Provider
      value={{
        user,
        isAuthenticated: isAuth,
        loading,
        login,
        register,
        logout,
        checkAuth,
      }}
    >
      {children}
    </PublicAuthContext.Provider>
  );
};

