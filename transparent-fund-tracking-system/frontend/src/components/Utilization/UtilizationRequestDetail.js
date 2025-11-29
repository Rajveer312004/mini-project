import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchUtilizationRequest,
  approveRequest,
  rejectRequest,
  recordExpenditure,
  uploadProof,
  completeRequest,
  generateCertificate
} from "../../services/utilizationApi";

const UtilizationRequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("details");
  const [request, setRequest] = useState(null);
  const [expenditures, setExpenditures] = useState([]);
  const [proofs, setProofs] = useState([]);
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  
  // Form states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showExpenditureForm, setShowExpenditureForm] = useState(false);
  const [showProofForm, setShowProofForm] = useState(false);
  const [expenditureForm, setExpenditureForm] = useState({
    activity: "",
    description: "",
    amount: "",
    category: "other",
    vendor: "",
    billNumber: "",
    recordedBy: ""
  });
  const [proofForm, setProofForm] = useState({
    proofType: "photograph",
    title: "",
    description: "",
    uploadedBy: "",
    location: ""
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchUtilizationRequest(id);
      setRequest(data.request);
      setExpenditures(data.expenditures || []);
      setProofs(data.proofs || []);
      setCertificate(data.certificate || null);
    } catch (error) {
      console.error("Error loading request:", error);
      setMessage({ type: "error", text: "Failed to load request details" });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
    // Try to get executor from wallet
    if (window.ethereum) {
      window.ethereum.request({ method: "eth_requestAccounts" })
        .then(accounts => {
          if (accounts && accounts.length > 0) {
            setExpenditureForm(prev => ({ ...prev, recordedBy: accounts[0] }));
            setProofForm(prev => ({ ...prev, uploadedBy: accounts[0] }));
          }
        })
        .catch(() => {
          setExpenditureForm(prev => ({ ...prev, recordedBy: "admin-offchain" }));
          setProofForm(prev => ({ ...prev, uploadedBy: "admin-offchain" }));
        });
    } else {
      setExpenditureForm(prev => ({ ...prev, recordedBy: "admin-offchain" }));
      setProofForm(prev => ({ ...prev, uploadedBy: "admin-offchain" }));
    }
  }, [loadData]);

  const handleApprove = async () => {
    if (!window.confirm("Are you sure you want to approve this request? This will process the transaction on blockchain.")) {
      return;
    }

    try {
      const result = await approveRequest(id, request.executor);
      setMessage({ type: "success", text: result.message || "Request approved successfully!" });
      loadData();
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.error || "Failed to approve request" });
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setMessage({ type: "error", text: "Please provide a rejection reason" });
      return;
    }

    try {
      await rejectRequest(id, rejectionReason, request.executor);
      setMessage({ type: "success", text: "Request rejected successfully!" });
      setShowRejectModal(false);
      setRejectionReason("");
      loadData();
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.error || "Failed to reject request" });
    }
  };

  const handleSubmitExpenditure = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.keys(expenditureForm).forEach(key => {
        if (expenditureForm[key]) formData.append(key, expenditureForm[key]);
      });

      const billFile = e.target.bill?.files?.[0];
      if (billFile) {
        formData.append('bill', billFile);
      }

      await recordExpenditure(id, formData);
      setMessage({ type: "success", text: "Expenditure recorded successfully!" });
      setShowExpenditureForm(false);
      setExpenditureForm({
        activity: "",
        description: "",
        amount: "",
        category: "other",
        vendor: "",
        billNumber: "",
        recordedBy: expenditureForm.recordedBy
      });
      loadData();
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.error || "Failed to record expenditure" });
    }
  };

  const handleSubmitProof = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.keys(proofForm).forEach(key => {
        if (proofForm[key]) formData.append(key, proofForm[key]);
      });

      const file = e.target.file?.files?.[0];
      if (!file) {
        setMessage({ type: "error", text: "Please select a file" });
        return;
      }
      formData.append('file', file);

      await uploadProof(id, formData);
      setMessage({ type: "success", text: "Proof uploaded successfully!" });
      setShowProofForm(false);
      setProofForm({
        proofType: "photograph",
        title: "",
        description: "",
        uploadedBy: proofForm.uploadedBy,
        location: ""
      });
      loadData();
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.error || "Failed to upload proof" });
    }
  };

  const handleComplete = async () => {
    if (!window.confirm("Are you sure you want to mark this request as completed?")) {
      return;
    }

    try {
      await completeRequest(id, request.executor);
      setMessage({ type: "success", text: "Request marked as completed!" });
      loadData();
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.error || "Failed to complete request" });
    }
  };

  const handleGenerateCertificate = async () => {
    try {
      const result = await generateCertificate(id, request.executor);
      setMessage({ type: "success", text: result.message || "Certificate generated successfully!" });
      loadData();
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.error || "Failed to generate certificate" });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!request) {
    return <div className="text-center py-8 text-red-600">Request not found</div>;
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      "in-progress": "bg-blue-100 text-blue-800",
      completed: "bg-purple-100 text-purple-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
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

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <button
            onClick={() => navigate("/utilization/requests")}
            className="text-green-600 hover:text-green-800 mb-2"
          >
            ← Back to Requests
          </button>
          <h2 className="text-2xl font-bold text-green-700">Request Details: {request.requestId}</h2>
        </div>
        <div className="flex gap-2">
          {request.status === "pending" && (
            <>
              <button
                onClick={handleApprove}
                className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 transition"
              >
                Approve
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
              >
                Reject
              </button>
            </>
          )}
          {request.status === "in-progress" && (
            <button
              onClick={handleComplete}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition"
            >
              Mark Complete
            </button>
          )}
        </div>
      </div>

      {message.text && (
        <div
          className={`p-4 mb-4 rounded ${
            message.type === "success"
              ? "bg-green-100 text-green-800 border border-green-400"
              : "bg-red-100 text-red-800 border border-red-400"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Status Badge */}
      <div className="mb-4">
        <span className={`px-4 py-2 text-sm font-semibold rounded-full ${getStatusColor(request.status)}`}>
          Status: {request.status}
        </span>
        {request.txHash && (
          <a
            href={`https://sepolia.etherscan.io/tx/${request.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-4 text-blue-600 hover:underline"
          >
            View Transaction
          </a>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {["details", "expenditures", "proofs", "certificate"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`${
                activeTab === tab
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {activeTab === "details" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Scheme ID</label>
                <p className="text-lg font-semibold">{request.schemeId}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Requesting Agency</label>
                <p className="text-lg font-semibold">{request.requestingAgency}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Amount</label>
                <p className="text-lg font-semibold">₹{request.amount.toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Available Balance</label>
                <p className="text-lg font-semibold">₹{request.availableBalance?.toLocaleString() || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Purpose</label>
                <p className="text-lg">{request.purpose}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Total Expenditure</label>
                <p className="text-lg font-semibold">₹{(request.totalExpenditure || 0).toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="text-lg">{request.description || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Executor</label>
                <p className="text-xs break-all font-mono">{request.executor}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Created At</label>
                <p className="text-lg">{formatDate(request.createdAt)}</p>
              </div>
              {request.approvedAt && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Approved At</label>
                  <p className="text-lg">{formatDate(request.approvedAt)}</p>
                </div>
              )}
            </div>

            {request.supportingDocuments && request.supportingDocuments.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-500">Supporting Documents</label>
                <div className="mt-2 space-y-2">
                  {request.supportingDocuments.map((doc, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <a
                        href={getFileUrl(doc.filePath)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {doc.fileName}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "expenditures" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Expenditures</h3>
              {request.status === "approved" || request.status === "in-progress" ? (
                <button
                  onClick={() => setShowExpenditureForm(!showExpenditureForm)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                >
                  + Record Expenditure
                </button>
              ) : null}
            </div>

            {showExpenditureForm && (
              <form onSubmit={handleSubmitExpenditure} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
                <h4 className="font-semibold">Record New Expenditure</h4>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Activity"
                    required
                    value={expenditureForm.activity}
                    onChange={(e) => setExpenditureForm({ ...expenditureForm, activity: e.target.value })}
                    className="px-3 py-2 border rounded"
                  />
                  <input
                    type="number"
                    placeholder="Amount"
                    required
                    value={expenditureForm.amount}
                    onChange={(e) => setExpenditureForm({ ...expenditureForm, amount: e.target.value })}
                    className="px-3 py-2 border rounded"
                  />
                  <select
                    value={expenditureForm.category}
                    onChange={(e) => setExpenditureForm({ ...expenditureForm, category: e.target.value })}
                    className="px-3 py-2 border rounded"
                  >
                    <option value="labor">Labor</option>
                    <option value="materials">Materials</option>
                    <option value="equipment">Equipment</option>
                    <option value="transport">Transport</option>
                    <option value="other">Other</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Vendor"
                    value={expenditureForm.vendor}
                    onChange={(e) => setExpenditureForm({ ...expenditureForm, vendor: e.target.value })}
                    className="px-3 py-2 border rounded"
                  />
                  <input
                    type="text"
                    placeholder="Bill Number"
                    value={expenditureForm.billNumber}
                    onChange={(e) => setExpenditureForm({ ...expenditureForm, billNumber: e.target.value })}
                    className="px-3 py-2 border rounded"
                  />
                  <input
                    type="file"
                    name="bill"
                    accept="image/*,.pdf"
                    className="px-3 py-2 border rounded"
                  />
                  <textarea
                    placeholder="Description"
                    value={expenditureForm.description}
                    onChange={(e) => setExpenditureForm({ ...expenditureForm, description: e.target.value })}
                    className="px-3 py-2 border rounded col-span-2"
                    rows="2"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowExpenditureForm(false)}
                    className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {expenditures.length === 0 ? (
              <p className="text-gray-500">No expenditures recorded yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Activity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bill</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {expenditures.map((exp) => (
                      <tr key={exp._id}>
                        <td className="px-6 py-4 whitespace-nowrap">{exp.activity}</td>
                        <td className="px-6 py-4 whitespace-nowrap">₹{exp.amount.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap capitalize">{exp.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{formatDate(exp.expenditureDate)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {exp.billDocument?.filePath ? (
                            <a
                              href={getFileUrl(exp.billDocument.filePath)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              View Bill
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "proofs" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Proof of Work</h3>
              {request.status === "approved" || request.status === "in-progress" || request.status === "completed" ? (
                <button
                  onClick={() => setShowProofForm(!showProofForm)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                >
                  + Upload Proof
                </button>
              ) : null}
            </div>

            {showProofForm && (
              <form onSubmit={handleSubmitProof} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
                <h4 className="font-semibold">Upload Proof of Work</h4>
                <div className="grid grid-cols-2 gap-4">
                  <select
                    value={proofForm.proofType}
                    onChange={(e) => setProofForm({ ...proofForm, proofType: e.target.value })}
                    required
                    className="px-3 py-2 border rounded"
                  >
                    <option value="photograph">Photograph</option>
                    <option value="bill">Bill</option>
                    <option value="receipt">Receipt</option>
                    <option value="certificate">Certificate</option>
                    <option value="other">Other</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Title"
                    required
                    value={proofForm.title}
                    onChange={(e) => setProofForm({ ...proofForm, title: e.target.value })}
                    className="px-3 py-2 border rounded"
                  />
                  <input
                    type="text"
                    placeholder="Location (optional)"
                    value={proofForm.location}
                    onChange={(e) => setProofForm({ ...proofForm, location: e.target.value })}
                    className="px-3 py-2 border rounded"
                  />
                  <input
                    type="file"
                    name="file"
                    required
                    accept="image/*,.pdf"
                    className="px-3 py-2 border rounded"
                  />
                  <textarea
                    placeholder="Description"
                    value={proofForm.description}
                    onChange={(e) => setProofForm({ ...proofForm, description: e.target.value })}
                    className="px-3 py-2 border rounded col-span-2"
                    rows="2"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Upload
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowProofForm(false)}
                    className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {proofs.length === 0 ? (
              <p className="text-gray-500">No proofs uploaded yet</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {proofs.map((proof) => (
                  <div key={proof._id} className="border rounded-lg p-4">
                    <h4 className="font-semibold">{proof.title}</h4>
                    <p className="text-sm text-gray-500 capitalize">{proof.proofType}</p>
                    <p className="text-sm mt-2">{proof.description}</p>
                    {proof.file?.filePath && (
                      <div className="mt-4">
                        {proof.file.fileType.startsWith('image/') ? (
                          <img
                            src={getFileUrl(proof.file.filePath)}
                            alt={proof.title}
                            className="w-full h-48 object-cover rounded"
                          />
                        ) : (
                          <a
                            href={getFileUrl(proof.file.filePath)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            View Document
                          </a>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      Uploaded: {formatDate(proof.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "certificate" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Utilization Certificate</h3>
              {request.status === "completed" && !certificate && (
                <button
                  onClick={handleGenerateCertificate}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                >
                  Generate Certificate
                </button>
              )}
            </div>

            {certificate ? (
              <div className="space-y-4 p-6 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Certificate Number</label>
                    <p className="text-lg font-semibold">{certificate.certificateNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Scheme Name</label>
                    <p className="text-lg font-semibold">{certificate.schemeName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Requesting Agency</label>
                    <p className="text-lg">{certificate.requestingAgency}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Approved Amount</label>
                    <p className="text-lg font-semibold">₹{certificate.approvedAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Total Expenditure</label>
                    <p className="text-lg font-semibold">₹{certificate.totalExpenditure.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Remaining Balance</label>
                    <p className="text-lg font-semibold">₹{certificate.remainingBalance.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Period</label>
                    <p className="text-lg">
                      {formatDate(certificate.period?.startDate)} - {formatDate(certificate.period?.endDate)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Generated At</label>
                    <p className="text-lg">{formatDate(certificate.generatedAt)}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">
                {request.status === "completed"
                  ? "No certificate generated yet. Click 'Generate Certificate' to create one."
                  : "Complete the request first to generate a certificate."}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Reject Request</h3>
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
                onClick={handleReject}
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

export default UtilizationRequestDetail;

