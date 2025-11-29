import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Allow access if authenticated in context or sessionStorage
  const sessionAuth = typeof window !== 'undefined' ? sessionStorage.getItem('adminAuthenticated') : null;
  if (isAuthenticated || sessionAuth === 'true') {
    return children;
  }

  // Otherwise redirect to login
  return <Navigate to="/admin" replace />;
};

export default ProtectedRoute;

