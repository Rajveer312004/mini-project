import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { usePublicAuth } from "../../context/PublicAuthContext";

const PublicDashboard = () => {
  const { user, isAuthenticated, logout } = usePublicAuth();
  const navigate = useNavigate();
  const linkClass =
    "block py-2 px-4 rounded hover:bg-purple-600 hover:text-white transition";
  const activeClass = "bg-purple-600 text-white";

  const handleLogout = () => {
    logout();
    navigate("/public/schemes", { replace: true });
  };

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md p-4 flex flex-col">
        <h2 className="text-2xl font-bold mb-2 text-purple-700">Public Portal</h2>
        {isAuthenticated && user && (
          <p className="text-sm text-gray-600 mb-4">
            Welcome, {user.fullName || user.email}
          </p>
        )}
        <nav className="space-y-1 flex-1">
          <NavLink
            to="/public/schemes"
            className={({ isActive }) =>
              `${linkClass} ${isActive ? activeClass : "text-gray-700"}`
            }
          >
            📊 View Schemes
          </NavLink>
          <NavLink
            to="/public/transactions"
            className={({ isActive }) =>
              `${linkClass} ${isActive ? activeClass : "text-gray-700"}`
            }
          >
            💰 Transaction History
          </NavLink>
          {isAuthenticated ? (
            <>
              <NavLink
                to="/public/grievance"
                className={({ isActive }) =>
                  `${linkClass} ${isActive ? activeClass : "text-gray-700"}`
                }
              >
                📝 Submit Grievance
              </NavLink>
              <NavLink
                to="/public/my-grievances"
                className={({ isActive }) =>
                  `${linkClass} ${isActive ? activeClass : "text-gray-700"}`
                }
              >
                📋 My Grievances
              </NavLink>
            </>
          ) : (
            <NavLink
              to="/public/signin"
              className={({ isActive }) =>
                `${linkClass} ${isActive ? activeClass : "text-gray-700"}`
              }
            >
              🔐 Sign In
            </NavLink>
          )}
          <NavLink
            to="/public/reports"
            className={({ isActive }) =>
              `${linkClass} ${isActive ? activeClass : "text-gray-700"}`
            }
          >
            📥 Download Reports
          </NavLink>
        </nav>
        
        {/* User Info & Logout */}
        <div className="mt-auto pt-4 border-t">
          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition"
            >
              🚪 Logout
            </button>
          ) : (
            <div className="space-y-2">
              <NavLink
                to="/public/signup"
                className="block w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 transition text-center"
              >
                Sign Up
              </NavLink>
              <p className="text-xs text-gray-500 text-center">
                Sign up to submit grievances and track status
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default PublicDashboard;

