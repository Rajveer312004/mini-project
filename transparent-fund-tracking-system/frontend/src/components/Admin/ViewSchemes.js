import React, { useEffect, useState } from "react";
import { fetchSchemes } from "../../services/adminApi";

const ViewSchemes = () => {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 🔹 Load schemes from backend API
  useEffect(() => {
    const loadSchemes = async () => {
      try {
        setLoading(true);
        const allSchemes = await fetchSchemes();
        setSchemes(allSchemes);
        setError("");
      } catch (err) {
        console.error("Error loading schemes:", err);
        setError("Failed to load schemes. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    loadSchemes();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadSchemes, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculatePercentage = (used, total) => {
    if (total === 0) return 0;
    return ((used / total) * 100).toFixed(1);
  };

  return (
    <div className="bg-gray-100 min-h-screen p-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-blue-700">
          Government Funded Schemes
        </h1>
        <button
          onClick={async () => {
            setLoading(true);
            try {
              const allSchemes = await fetchSchemes();
              setSchemes(allSchemes);
              setError("");
            } catch (err) {
              setError("Failed to refresh schemes.");
            } finally {
              setLoading(false);
            }
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          🔄 Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-4 border border-red-300">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-600 py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2">Loading schemes...</p>
        </div>
      ) : schemes.length === 0 ? (
        <div className="text-center text-gray-600 py-10">
          <p className="text-xl">No schemes found.</p>
          <p className="text-sm mt-2">Add a new scheme to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {schemes.map((scheme) => {
            const remaining = scheme.totalFunds - scheme.usedFunds;
            const percentage = calculatePercentage(scheme.usedFunds, scheme.totalFunds);
            
            return (
              <div
                key={scheme.id}
                className="bg-white shadow-lg rounded-xl p-6 hover:shadow-2xl transition"
              >
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold text-blue-800">
                    {scheme.name}
                  </h2>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-semibold">
                    ID: {scheme.id}
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Funds:</span>
                    <span className="font-semibold text-green-700">
                      {formatCurrency(scheme.totalFunds)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Used Funds:</span>
                    <span className="font-semibold text-orange-600">
                      {formatCurrency(scheme.usedFunds)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Remaining:</span>
                    <span className="font-semibold text-blue-700">
                      {formatCurrency(remaining)}
                    </span>
                  </div>
                </div>

                {/* Eligibility Criteria */}
                {scheme.eligibilityCriteria && scheme.eligibilityCriteria.trim() && (
                  <div className="mb-4 pt-4 border-t">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">📋 Eligibility Criteria:</h3>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded border border-gray-200 whitespace-pre-line">
                      {scheme.eligibilityCriteria}
                    </p>
                  </div>
                )}

                {/* Progress Bar */}
                <div className="mb-2">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Utilization</span>
                    <span>{percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ViewSchemes;
