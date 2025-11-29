import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useUtilizationAuth } from "../../context/UtilizationAuthContext";

const UtilizationDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useUtilizationAuth();
  const linkClass =
    "block py-2 px-4 rounded hover:bg-green-600 hover:text-white transition";
  const activeClass = "bg-green-600 text-white";

  const handleLogout = () => {
    logout();
    navigate("/utilization/signin", { replace: true });
  };

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md p-4 flex flex-col">
        <h2 className="text-2xl font-bold mb-2 text-green-700">Fund Utilization</h2>
        {/* <p className="text-sm text-gray-600 mb-4">
          Module 2: For Implementing Agencies
        </p> */}
        
        {/* User Info */}
        {user && (
          <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm font-semibold text-gray-800">{user.fullName}</p>
            <p className="text-xs text-gray-600">{user.organization}</p>
            <p className="text-xs text-gray-500 mt-1">{user.email}</p>
          </div>
        )}

        <nav className="space-y-1 flex-1">
          <NavLink
            to="/utilization/requests"
            className={({ isActive }) =>
              `${linkClass} ${isActive ? activeClass : "text-gray-700"}`
            }
          >
            📋 My Requests
          </NavLink>
          <NavLink
            to="/utilization/new"
            className={({ isActive }) =>
              `${linkClass} ${isActive ? activeClass : "text-gray-700"}`
            }
          >
            ➕ Submit Request
          </NavLink>
        </nav>
        
        {/* Logout Button */}
        <div className="mt-auto pt-4 border-t space-y-2">
          <button
            onClick={() => navigate("/")}
            className="w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition"
          >
            🏠 Home
          </button>
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition"
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default UtilizationDashboard;

