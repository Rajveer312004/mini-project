import React, { useState, useEffect, useCallback } from "react";
import { fetchPublicSchemes } from "../../services/publicApi";

const SchemesView = () => {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    schemeId: "",
    minBudget: "",
    maxBudget: ""
  });

  const loadSchemes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPublicSchemes(filters);
      setSchemes(data);
    } catch (error) {
      console.error("Error loading schemes:", error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadSchemes();
  }, [loadSchemes]);

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <div className="text-center py-8">Loading schemes...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-purple-700">Active Schemes & Budgets</h2>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Search by scheme name..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Scheme ID</label>
          <input
            type="number"
            name="schemeId"
            value={filters.schemeId}
            onChange={handleFilterChange}
            placeholder="Scheme ID"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Min Budget (₹)</label>
          <input
            type="number"
            name="minBudget"
            value={filters.minBudget}
            onChange={handleFilterChange}
            placeholder="Minimum"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max Budget (₹)</label>
          <input
            type="number"
            name="maxBudget"
            value={filters.maxBudget}
            onChange={handleFilterChange}
            placeholder="Maximum"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Schemes Grid */}
      {schemes.length === 0 ? (
        <div className="text-center py-8 text-gray-500 bg-white rounded-lg shadow-md">
          No schemes found
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schemes.map((scheme) => (
            <div key={scheme.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-800">{scheme.name}</h3>
                <span className="text-sm text-gray-500">ID: {scheme.id}</span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Total Budget</label>
                  <p className="text-lg font-semibold text-gray-900">
                    ₹{scheme.totalFunds.toLocaleString()}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Used Funds</label>
                  <p className="text-lg font-semibold text-orange-600">
                    ₹{scheme.usedFunds.toLocaleString()}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Remaining Funds</label>
                  <p className="text-lg font-semibold text-green-600">
                    ₹{scheme.remainingFunds.toLocaleString()}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Utilization</label>
                  <div className="mt-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span>{scheme.utilizationPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all"
                        style={{ width: `${scheme.utilizationPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {scheme.eligibilityCriteria && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Eligibility</label>
                    <p className="text-sm text-gray-700 mt-1">{scheme.eligibilityCriteria}</p>
                  </div>
                )}

                <div className="pt-2 border-t text-xs text-gray-400">
                  Created: {formatDate(scheme.createdAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SchemesView;

