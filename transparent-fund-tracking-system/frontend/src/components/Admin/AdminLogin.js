import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const AdminLogin = () => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login, isAuthenticated, loading } = useAuth();

  // Redirect if already authenticated (only after loading is complete)
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!password.trim()) {
      setError("Please enter a password!");
      return;
    }
    
    if (password === "admin123") {
      try {
        // Set authentication state first
        login();
        // Wait a moment for state to update, then navigate
        await new Promise(resolve => setTimeout(resolve, 50));
        navigate("/admin/dashboard", { replace: true });
      } catch (err) {
        console.error("Login error:", err);
        setError("Login failed. Please try again.");
      }
    } else {
      setError("Invalid password! Please try again.");
    }
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If already authenticated, don't show login form (will redirect)
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">🔐 Admin Login</h2>
        <form onSubmit={handleLogin}>
          <input
            type="password"
            className="border p-2 w-full rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter admin password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            autoFocus
          />
          
          {error && (
            <div className="bg-red-100 text-red-800 p-2 rounded mb-4 text-sm border border-red-300">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
