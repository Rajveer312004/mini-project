import React, { createContext, useState, useContext, useEffect } from "react";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check authentication status on mount (session-based)
  useEffect(() => {
    try {
      // Migrate away from legacy localStorage to sessionStorage
      const legacy = localStorage.getItem("adminAuthenticated");
      if (legacy) localStorage.removeItem("adminAuthenticated");

      const authStatus = sessionStorage.getItem("adminAuthenticated");
      // Only set authenticated if value is exactly "true" (per session)
      if (authStatus === "true") {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        // Clear any invalid or old values
        if (authStatus) {
          sessionStorage.removeItem("adminAuthenticated");
        }
      }
    } catch (error) {
      console.error("Error reading authentication:", error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = () => {
    sessionStorage.setItem("adminAuthenticated", "true");
    setIsAuthenticated(true);
  };

  const logout = () => {
    sessionStorage.removeItem("adminAuthenticated");
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

