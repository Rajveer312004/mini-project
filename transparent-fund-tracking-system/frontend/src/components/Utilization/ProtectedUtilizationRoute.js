import React from "react";
import { Navigate } from "react-router-dom";
import { useUtilizationAuth } from "../../context/UtilizationAuthContext";

const ProtectedUtilizationRoute = ({ children }) => {
  const { isAuthenticated, loading } = useUtilizationAuth();

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <p className="mt-2 text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to sign in if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/utilization/signin" replace />;
  }

  return children;
};

export default ProtectedUtilizationRoute;

