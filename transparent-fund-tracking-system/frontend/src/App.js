import React from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { UtilizationAuthProvider } from "./context/UtilizationAuthContext";
import { PublicAuthProvider } from "./context/PublicAuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ProtectedUtilizationRoute from "./components/Utilization/ProtectedUtilizationRoute";
import AdminLogin from "./components/Admin/AdminLogin";
import AdminDashboard from "./components/Admin/AdminDashboard";
import AddScheme from "./components/Admin/AddScheme";
import UseFund from "./components/Admin/UseFund";
import ViewSchemes from "./components/Admin/ViewSchemes";
import TransactionHistory from "./components/Admin/TransactionHistory";
import ManageUtilizationRequests from "./components/Admin/ManageUtilizationRequests";
import GrievanceReports from "./components/Admin/GrievanceReports";
import UtilizationDashboard from "./components/Utilization/UtilizationDashboard";
import UtilizationRequestsList from "./components/Utilization/UtilizationRequestsList";
import FundUtilizationRequestForm from "./components/Utilization/FundUtilizationRequestForm";
import UtilizationRequestDetail from "./components/Utilization/UtilizationRequestDetail";
import SignIn from "./components/Utilization/SignIn";
import SignUp from "./components/Utilization/SignUp";
import PublicDashboard from "./components/Public/PublicDashboard";
import SchemesView from "./components/Public/SchemesView";
import PublicTransactionHistory from "./components/Public/PublicTransactionHistory";
import GrievanceSubmission from "./components/Public/GrievanceSubmission";
import ReportDownload from "./components/Public/ReportDownload";
import PublicSignIn from "./components/Public/PublicSignIn";
import PublicSignUp from "./components/Public/PublicSignUp";
import MyGrievances from "./components/Public/MyGrievances";
import ProtectedPublicRoute from "./components/Public/ProtectedPublicRoute";

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-100 text-gray-900">
          {/* Main Navigation */}
          <nav className="bg-gradient-to-r from-blue-600 via-green-600 to-purple-600 text-white p-4 shadow-md flex justify-between items-center">
            <Link to="/" className="text-xl font-bold hover:opacity-80 transition">
              Transparent Fund Tracker 💰
            </Link>
            <div className="space-x-2">
              <Link to="/public/schemes" className="hover:underline px-3 py-2 rounded hover:bg-white hover:bg-opacity-20 transition">
                👁️ Public Portal
              </Link>
              <Link to="/utilization/requests" className="hover:underline px-3 py-2 rounded hover:bg-white hover:bg-opacity-20 transition">
                📋 Fund Utilization
              </Link>
              <Link to="/admin" className="hover:underline px-3 py-2 rounded hover:bg-white hover:bg-opacity-20 transition">
                🔐 Admin Portal
              </Link>
            </div>
          </nav>

          {/* Main Routes */}
          <Routes>
            {/* Admin Login - Exact path match */}
            <Route path="/admin" element={<AdminLogin />} />

            {/* Admin Dashboard and nested routes - Protected */}
            <Route
              path="/admin/dashboard/*"
              element={
                <ProtectedRoute>
                  <div className="p-6">
                    <AdminDashboard />
                  </div>
                </ProtectedRoute>
              }
            >
              <Route index element={<ViewSchemes />} />
              <Route path="add-scheme" element={<AddScheme />} />
              <Route path="use-fund" element={<UseFund />} />
              <Route path="view-schemes" element={<ViewSchemes />} />
              <Route path="transactions" element={<TransactionHistory />} />
              <Route path="manage-requests" element={<ManageUtilizationRequests />} />
              <Route path="grievance-reports" element={<GrievanceReports />} />
            </Route>

            {/* Fund Utilization Module (Module 2) - For Implementing Agencies - Authentication Required */}
            <Route
              path="/utilization/*"
              element={
                <UtilizationAuthProvider>
                  <div className="p-6">
                    <UtilizationDashboard />
                  </div>
                </UtilizationAuthProvider>
              }
            >
              {/* Public auth routes */}
              <Route path="signin" element={<SignIn />} />
              <Route path="signup" element={<SignUp />} />
              
              {/* Protected routes */}
              <Route
                index
                element={
                  <ProtectedUtilizationRoute>
                    <Navigate to="/utilization/requests" replace />
                  </ProtectedUtilizationRoute>
                }
              />
              <Route
                path="requests"
                element={
                  <ProtectedUtilizationRoute>
                    <UtilizationRequestsList />
                  </ProtectedUtilizationRoute>
                }
              />
              <Route
                path="requests/:id"
                element={
                  <ProtectedUtilizationRoute>
                    <UtilizationRequestDetail />
                  </ProtectedUtilizationRoute>
                }
              />
              <Route
                path="new"
                element={
                  <ProtectedUtilizationRoute>
                    <FundUtilizationRequestForm />
                  </ProtectedUtilizationRoute>
                }
              />
            </Route>

            {/* Public Transparency Module (Module 3) - For Citizens - Authentication Required for Some Features */}
            <Route
              path="/public/*"
              element={
                <PublicAuthProvider>
                  <div className="p-6">
                    <PublicDashboard />
                  </div>
                </PublicAuthProvider>
              }
            >
              <Route index element={<Navigate to="/public/schemes" replace />} />
              <Route path="schemes" element={<SchemesView />} />
              <Route path="transactions" element={<PublicTransactionHistory />} />
              <Route path="reports" element={<ReportDownload />} />
              {/* Auth routes */}
              <Route path="signin" element={<PublicSignIn />} />
              <Route path="signup" element={<PublicSignUp />} />
              {/* Protected routes */}
              <Route
                path="grievance"
                element={
                  <ProtectedPublicRoute>
                    <GrievanceSubmission />
                  </ProtectedPublicRoute>
                }
              />
              <Route
                path="my-grievances"
                element={
                  <ProtectedPublicRoute>
                    <MyGrievances />
                  </ProtectedPublicRoute>
                }
              />
            </Route>

            {/* Home route */}
            <Route path="/" element={
              <div className="flex items-center justify-center min-h-screen">
                <div className="text-center max-w-2xl">
                  <h1 className="text-4xl font-bold mb-4 text-gray-800">Welcome to Transparent Fund Tracker</h1>
                  <p className="text-gray-600 mb-8">Promoting transparency and accountability in public fund management</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link
                      to="/public/schemes"
                      className="bg-purple-600 text-white px-6 py-4 rounded-lg hover:bg-purple-700 transition text-lg font-semibold shadow-md"
                    >
                      👁️ Public Portal<br/>
                      {/* <span className="text-sm font-normal">Module 3</span> */}
                    </Link>
                    <Link
                      to="/utilization/requests"
                      className="bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 transition text-lg font-semibold shadow-md"
                    >
                      📋 Fund Utilization<br/>
                      {/* <span className="text-sm font-normal">Module 2</span> */}
                    </Link>
                    <Link
                      to="/admin"
                      className="bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 transition text-lg font-semibold shadow-md"
                    >
                      🔐 Admin Portal<br/>
                      {/* <span className="text-sm font-normal">Module 1</span> */}
                    </Link>
                  </div>
                </div>
              </div>
            } />
            
            {/* Default redirect - if path doesn't match, redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;

