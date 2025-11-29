import React, { useState } from "react";
import { downloadReport } from "../../services/publicApi";

const ReportDownload = () => {
  const [loading, setLoading] = useState({ schemes: false, transactions: false });
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleDownload = async (type, format) => {
    setLoading(prev => ({ ...prev, [type]: true }));
    setMessage({ type: "", text: "" });

    try {
      const data = await downloadReport(type, format);

      if (format === 'csv') {
        // Create blob and download
        const blob = new Blob([data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${type}-report-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        setMessage({ 
          type: "success", 
          text: `✅ ${type.charAt(0).toUpperCase() + type.slice(1)} report downloaded successfully!` 
        });
      } else {
        // JSON download
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${type}-report-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        setMessage({ 
          type: "success", 
          text: `✅ ${type.charAt(0).toUpperCase() + type.slice(1)} report downloaded successfully!` 
        });
      }
    } catch (error) {
      console.error("Error downloading report:", error);
      setMessage({ 
        type: "error", 
        text: error.response?.data?.error || error.message || "Failed to download report" 
      });
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-purple-700">Download Reports</h2>
      <p className="text-gray-600 mb-6">
        Download comprehensive reports for offline analysis. Available in CSV and JSON formats.
      </p>

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Schemes Report */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-800">📊 Schemes Report</h3>
          <p className="text-sm text-gray-600 mb-4">
            Download complete information about all schemes including budgets, utilization, and eligibility criteria.
          </p>
          <div className="space-y-2">
            <button
              onClick={() => handleDownload('schemes', 'csv')}
              disabled={loading.schemes}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading.schemes ? "Downloading..." : "📥 Download CSV"}
            </button>
            <button
              onClick={() => handleDownload('schemes', 'json')}
              disabled={loading.schemes}
              className="w-full bg-purple-500 text-white py-2 px-4 rounded hover:bg-purple-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading.schemes ? "Downloading..." : "📥 Download JSON"}
            </button>
          </div>
        </div>

        {/* Transactions Report */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-800">💰 Transactions Report</h3>
          <p className="text-sm text-gray-600 mb-4">
            Download complete transaction history with all details including amounts, purposes, and blockchain hashes.
          </p>
          <div className="space-y-2">
            <button
              onClick={() => handleDownload('transactions', 'csv')}
              disabled={loading.transactions}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading.transactions ? "Downloading..." : "📥 Download CSV"}
            </button>
            <button
              onClick={() => handleDownload('transactions', 'json')}
              disabled={loading.transactions}
              className="w-full bg-purple-500 text-white py-2 px-4 rounded hover:bg-purple-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading.transactions ? "Downloading..." : "📥 Download JSON"}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 p-4 rounded border border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-2">Report Information:</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li><strong>CSV Format:</strong> Compatible with Excel, Google Sheets, and other spreadsheet applications</li>
          <li><strong>JSON Format:</strong> Machine-readable format for programmatic analysis</li>
          <li>Reports include all available data up to the time of download</li>
          <li>Large datasets may take a few moments to generate</li>
        </ul>
      </div>
    </div>
  );
};

export default ReportDownload;

