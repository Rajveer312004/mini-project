import React, { useEffect, useState, useCallback } from "react";
import { fetchGrievances } from "../../services/publicApi";
import { usePublicAuth } from "../../context/PublicAuthContext";

const MyGrievances = () => {
  const { user } = usePublicAuth();
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedGrievance, setSelectedGrievance] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    status: ""
  });

  const fetchGrievancesData = useCallback(async () => {
    if (!user || !user.email) return;

    try {
      setLoading(true);
      const data = await fetchGrievances({
        submittedBy: user.email,
        ...filters
      });
      setGrievances(data);
      setError("");
    } catch (error) {
      console.error("Error fetching grievances", error);
      setError("Failed to load your grievances. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user, filters]);

  useEffect(() => {
    if (user && user.email) {
      fetchGrievancesData();
    }
  }, [user, fetchGrievancesData]);

  const handleFilterChange = (e) => {
    setFilters({
      status: e.target.value
    });
  };

  const openDetailModal = (grievance) => {
    setSelectedGrievance(grievance);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedGrievance(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "under-review":
        return "bg-blue-100 text-blue-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryLabel = (category) => {
    const labels = {
      "fund-misuse": "Fund Misuse",
      "irregularity": "Irregularity",
      "delay": "Delay",
      "corruption": "Corruption",
      "other": "Other"
    };
    return labels[category] || category;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const downloadFile = (filePath, fileName) => {
    const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
    window.open(`${apiUrl}/${filePath}`, "_blank");
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Please sign in to view your grievances.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">My Grievance Reports</h2>
        <button
          onClick={fetchGrievancesData}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Status
            </label>
            <select
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="under-review">Under Review</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <p className="mt-2 text-gray-600">Loading your grievances...</p>
        </div>
      ) : grievances.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <p className="text-gray-600 text-lg">No grievances found.</p>
          <p className="text-gray-500 text-sm mt-2">
            Submit a grievance to track its status here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grievance ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scheme
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {grievances.map((grievance) => (
                  <tr key={grievance._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {grievance.grievanceId}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {grievance.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {grievance.schemeName || `Scheme ${grievance.schemeId || "N/A"}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {getCategoryLabel(grievance.category)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          grievance.status
                        )}`}
                      >
                        {grievance.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(grievance.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openDetailModal(grievance)}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal for Viewing Grievance Details */}
      {showModal && selectedGrievance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-bold text-gray-800">
                  Grievance Details
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Grievance ID
                    </label>
                    <p className="mt-1 text-sm text-gray-900 font-mono">
                      {selectedGrievance.grievanceId}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <span
                      className={`mt-1 px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getStatusColor(
                        selectedGrievance.status
                      )}`}
                    >
                      {selectedGrievance.status}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Category
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {getCategoryLabel(selectedGrievance.category)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Scheme
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedGrievance.schemeName || `Scheme ${selectedGrievance.schemeId || "N/A"}`}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Submitted Date
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {formatDate(selectedGrievance.createdAt)}
                    </p>
                  </div>
                  {selectedGrievance.reviewedAt && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Reviewed Date
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {formatDate(selectedGrievance.reviewedAt)}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Title
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedGrievance.title}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                    {selectedGrievance.description}
                  </p>
                </div>

                {selectedGrievance.location && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Location
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedGrievance.location}
                    </p>
                  </div>
                )}

                {selectedGrievance.reviewedBy && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Reviewed By
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedGrievance.reviewedBy}
                    </p>
                  </div>
                )}

                {selectedGrievance.reviewNotes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Review Notes
                    </label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">
                        {selectedGrievance.reviewNotes}
                      </p>
                    </div>
                  </div>
                )}

                {selectedGrievance.supportingDocuments &&
                  selectedGrievance.supportingDocuments.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Supporting Documents
                      </label>
                      <div className="space-y-2">
                        {selectedGrievance.supportingDocuments.map((doc, index) => (
                          <button
                            key={index}
                            onClick={() => downloadFile(doc.filePath, doc.fileName)}
                            className="block text-purple-600 hover:text-purple-800 text-sm underline"
                          >
                            📄 {doc.fileName}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyGrievances;

