import React, { useState, useEffect, useCallback } from "react";
import {
  fetchUtilizationRequests,
  approveRequest,
  rejectRequest,
  fetchUtilizationRequest
} from "../../services/utilizationApi";
import { fetchSchemes } from "../../services/adminApi";

const ManageUtilizationRequests = () => {
  const [requests, setRequests] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [filters, setFilters] = useState({
    schemeId: "",
    status: "pending" // Default to show pending requests
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [approvingId, setApprovingId] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [requestsData, schemesData] = await Promise.all([
        fetchUtilizationRequests(filters),
        fetchSchemes()
      ]);
      setRequests(requestsData);
      setSchemes(schemesData);
    } catch (error) {
      console.error("Error loading data:", error);
      setMessage({ type: "error", text: "Failed to load requests" });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const handleViewDetails = async (requestId) => {
    try {
      const data = await fetchUtilizationRequest(requestId);
      setSelectedRequest(data);
    } catch (error) {
      setMessage({ type: "error", text: "Failed to load request details" });
    }
  };

  const handleApprove = async (request) => {
    if (!window.confirm(`Are you sure you want to approve this request?\n\nRequest ID: ${request.requestId}\nAgency: ${request.requestingAgency}\nAmount: ₹${request.amount.toLocaleString()}\n\nThis will process the transaction on blockchain.`)) {
      return;
    }

    setApprovingId(request.requestId);
    setMessage({ type: "", text: "" });

    try {
      const result = await approveRequest(request.requestId, "admin");
      setMessage({ 
        type: "success", 
        text: `✅ ${result.message || 'Request approved successfully!'}\n${result.txHash ? `Transaction: ${result.txHash.substring(0, 20)}...` : ''}` 
      });
      loadData(); // Reload to show updated status
      if (selectedRequest && selectedRequest.request.requestId === request.requestId) {
        handleViewDetails(request.requestId); // Refresh details if viewing
      }
    } catch (error) {
      setMessage({ 
        type: "error", 
        text: error.response?.data?.error || error.message || "Failed to approve request" 
      });
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (request) => {
    if (!rejectionReason.trim()) {
      setMessage({ type: "error", text: "Please provide a rejection reason" });
      return;
    }

    try {
      await rejectRequest(request.requestId, rejectionReason, "admin");
      setMessage({ type: "success", text: "Request rejected successfully!" });
      setShowRejectModal(false);
      setRejectionReason("");
      setSelectedRequest(null);
      loadData();
    } catch (error) {
      setMessage({ 
        type: "error", 
        text: error.response?.data?.error || "Failed to reject request" 
      });
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
      approved: "bg-green-100 text-green-800 border-green-300",
      rejected: "bg-red-100 text-red-800 border-red-300",
      "in-progress": "bg-blue-100 text-blue-800 border-blue-300",
      completed: "bg-purple-100 text-purple-800 border-purple-300"
    };
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-300";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString();
  };

  const getFileUrl = (filePath) => {
    if (!filePath) return null;
    const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
    return `${apiUrl}/${filePath}`;
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-blue-700">Manage Fund Utilization Requests</h2>

      {message.text && (
        <div
          className={`p-4 mb-4 rounded border ${
            message.type === "success"
              ? "bg-green-100 text-green-800 border-green-400"
              : "bg-red-100 text-red-800 border-red-400"
          }`}
        >
          <pre className="whitespace-pre-wrap">{message.text}</pre>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Scheme</label>
          <select
            name="schemeId"
            value={filters.schemeId}
            onChange={handleFilterChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Schemes</option>
            {schemes.map((scheme) => (
              <option key={scheme.id} value={scheme.id}>
                {scheme.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={loadData}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        {requests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No utilization requests found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scheme
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agency
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purpose
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((request) => (
                  <tr key={request.requestId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {request.requestId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Scheme ID: {request.schemeId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.requestingAgency}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      ₹{request.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {request.purpose}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(request.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleViewDetails(request.requestId)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </button>
                      {request.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleApprove(request)}
                            disabled={approvingId === request.requestId}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {approvingId === request.requestId ? "Approving..." : "Approve"}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRequest({ request });
                              setShowRejectModal(true);
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Request Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                Request Details: {selectedRequest.request.requestId}
              </h3>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Scheme ID</label>
                  <p className="text-lg font-semibold">{selectedRequest.request.schemeId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Requesting Agency</label>
                  <p className="text-lg font-semibold">{selectedRequest.request.requestingAgency}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Amount</label>
                  <p className="text-lg font-semibold">₹{selectedRequest.request.amount.toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Available Balance</label>
                  <p className="text-lg font-semibold">₹{selectedRequest.availableBalance?.toLocaleString() || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Purpose</label>
                  <p className="text-lg">{selectedRequest.request.purpose}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full border ${getStatusColor(selectedRequest.request.status)}`}>
                    {selectedRequest.request.status}
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-lg">{selectedRequest.request.description || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Executor</label>
                  <p className="text-xs break-all font-mono">{selectedRequest.request.executor}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created At</label>
                  <p className="text-lg">{formatDate(selectedRequest.request.createdAt)}</p>
                </div>
                {selectedRequest.request.approvedAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Approved At</label>
                    <p className="text-lg">{formatDate(selectedRequest.request.approvedAt)}</p>
                  </div>
                )}
                {selectedRequest.request.txHash && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-500">Transaction Hash</label>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${selectedRequest.request.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline break-all"
                    >
                      {selectedRequest.request.txHash}
                    </a>
                  </div>
                )}
              </div>

              {selectedRequest.request.supportingDocuments && selectedRequest.request.supportingDocuments.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Supporting Documents</label>
                  <div className="mt-2 space-y-2">
                    {selectedRequest.request.supportingDocuments.map((doc, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <a
                          href={getFileUrl(doc.filePath)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          📄 {doc.fileName}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedRequest.request.status === "pending" && (
                <div className="flex gap-2 pt-4 border-t">
                  <button
                    onClick={() => handleApprove(selectedRequest.request)}
                    disabled={approvingId === selectedRequest.request.requestId}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {approvingId === selectedRequest.request.requestId ? "Approving..." : "✅ Approve Request"}
                  </button>
                  <button
                    onClick={() => {
                      setShowRejectModal(true);
                    }}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
                  >
                    ❌ Reject Request
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Reject Request</h3>
            <p className="text-sm text-gray-600 mb-2">
              Request ID: {selectedRequest?.request?.requestId}
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full px-3 py-2 border rounded mb-4"
              rows="4"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason("");
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(selectedRequest.request)}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUtilizationRequests;

