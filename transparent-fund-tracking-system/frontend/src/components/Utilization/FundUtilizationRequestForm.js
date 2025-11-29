import React, { useState, useEffect } from "react";
import { submitUtilizationRequest } from "../../services/utilizationApi";
import { fetchSchemes } from "../../services/adminApi";
import { useUtilizationAuth } from "../../context/UtilizationAuthContext";

const FundUtilizationRequestForm = () => {
  const { user } = useUtilizationAuth();
  const [formData, setFormData] = useState({
    schemeId: "",
    amount: "",
    purpose: "",
    description: ""
  });
  const [documents, setDocuments] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const loadSchemes = async () => {
      try {
        const schemesList = await fetchSchemes();
        setSchemes(schemesList);
      } catch (error) {
        console.error("Error loading schemes:", error);
        setMessage({ type: "error", text: "Failed to load schemes" });
      }
    };
    loadSchemes();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    setDocuments(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.schemeId || !formData.amount || !formData.purpose) {
      setMessage({ type: "error", text: "Please fill in all required fields!" });
      return;
    }

    const amountNum = parseFloat(formData.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setMessage({ type: "error", text: "Please enter a valid amount!" });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      // Create FormData for file upload
      // Note: requestingAgency and executor are automatically set from authenticated user
      const submitData = new FormData();
      submitData.append('schemeId', formData.schemeId);
      submitData.append('amount', formData.amount);
      submitData.append('purpose', formData.purpose);
      submitData.append('description', formData.description || "");

      // Append documents
      documents.forEach((file) => {
        submitData.append('documents', file);
      });

      const result = await submitUtilizationRequest(submitData);

      setMessage({
        type: "success",
        text: `✅ ${result.message || 'Fund utilization request submitted successfully!'}\nRequest ID: ${result.request?.requestId || ''}`
      });

      // Reset form
      setFormData({
        schemeId: "",
        amount: "",
        purpose: "",
        description: ""
      });
      setDocuments([]);
    } catch (error) {
      console.error("Error submitting request:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.error || error.message || "Failed to submit utilization request"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-green-700">Submit Fund Utilization Request</h2>

      {message.text && (
        <div
          className={`p-4 mb-4 rounded ${
            message.type === "success"
              ? "bg-green-100 text-green-800 border border-green-400"
              : "bg-red-100 text-red-800 border border-red-400"
          }`}
        >
          <pre className="whitespace-pre-wrap">{message.text}</pre>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Scheme <span className="text-red-500">*</span>
          </label>
          <select
            name="schemeId"
            value={formData.schemeId}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Select a scheme</option>
            {schemes.map((scheme) => (
              <option key={scheme.id} value={scheme.id}>
                {scheme.name} (ID: {scheme.id}) - Available: ₹{(scheme.totalFunds - scheme.usedFunds).toLocaleString()}
              </option>
            ))}
          </select>
        </div>

        {user && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-4">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Requesting Agency:</span> {user.organization}
            </p>
            <p className="text-xs text-gray-500 mt-1">This will be automatically set from your account</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount (₹) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            placeholder="Enter amount"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Purpose <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="purpose"
            value={formData.purpose}
            onChange={handleChange}
            required
            placeholder="Enter purpose of utilization"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            placeholder="Enter detailed description (optional)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Supporting Documents
          </label>
          <input
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {documents.length > 0 && (
            <p className="mt-2 text-sm text-gray-600">
              {documents.length} file(s) selected
            </p>
          )}
        </div>


        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? "Submitting..." : "Submit Request"}
        </button>
      </form>
    </div>
  );
};

export default FundUtilizationRequestForm;

