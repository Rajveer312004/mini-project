import React from "react";
import { Navigate } from "react-router-dom";
import { usePublicAuth } from "../../context/PublicAuthContext";

const ProtectedPublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = usePublicAuth();

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <p className="mt-2 text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Allow access if authenticated
  if (isAuthenticated) {
    return children;
  }

  // Otherwise redirect to sign in
  return <Navigate to="/public/signin" replace />;
};

export default ProtectedPublicRoute;

