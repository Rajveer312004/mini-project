import React, { useState } from "react";
import { addScheme } from "../../services/adminApi";
import { useNavigate } from "react-router-dom";

const AddScheme = () => {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [eligibilityCriteria, setEligibilityCriteria] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const navigate = useNavigate();

  // 🔹 Add new scheme via backend API
  const handleAddScheme = async (e) => {
    e.preventDefault();

    if (!name || !amount) {
      setMessage({ type: "error", text: "Please fill in all required fields!" });
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setMessage({ type: "error", text: "Please enter a valid amount!" });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });
    
    try {
      const result = await addScheme(name, amountNum, eligibilityCriteria || "");
      
      let successMessage = `✅ ${result.message || 'Scheme added successfully!'}`;
      if (result.schemeId) {
        successMessage += `\nScheme ID: ${result.schemeId}`;
      }
      if (result.warning) {
        successMessage += `\n⚠️ ${result.warning}`;
      }
      if (result.txHash && result.txHash !== 'N/A') {
        successMessage += `\nTransaction: ${result.txHash.substring(0, 10)}...`;
      }
      
      setMessage({ 
        type: "success", 
        text: successMessage
      });
      setName("");
      setAmount("");
      setEligibilityCriteria("");
      
      // Refresh schemes list after 2 seconds (unless there's a blockchain warning)
      if (result.savedToBlockchain) {
        setTimeout(() => {
          navigate("/admin/dashboard/view-schemes");
        }, 2000);
      } else {
        // If only saved to DB, wait longer and show a message
        setTimeout(() => {
          navigate("/admin/dashboard/view-schemes");
        }, 3000);
      }
    } catch (error) {
      console.error("Error adding scheme:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to add scheme. Please try again.";
      const errorHint = error.response?.data?.hint || "";
      
      setMessage({ 
        type: "error", 
        text: (
          <div>
            <div className="font-semibold">{errorMessage}</div>
            {errorHint && <div className="text-sm mt-2 text-gray-600">{errorHint}</div>}
            {error.response?.data?.warning && (
              <div className="text-sm mt-2 text-yellow-700 bg-yellow-50 p-2 rounded">
                ⚠️ {error.response.data.warning}
              </div>
            )}
            {error.response?.data?.blockchainError && (
              <div className="text-xs mt-2 text-gray-500">
                Blockchain Error: {error.response.data.blockchainError}
              </div>
            )}
          </div>
        )
      });
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center bg-gray-100 min-h-screen p-10">
      <h1 className="text-3xl font-bold mb-6 text-blue-700">
        Add New Government Scheme
      </h1>

      {/* Message Display */}
      {message.text && (
        <div
          className={`w-96 p-4 rounded-lg mb-4 ${
            message.type === "success"
              ? "bg-green-100 text-green-800 border border-green-300"
              : "bg-red-100 text-red-800 border border-red-300"
          }`}
        >
          {typeof message.text === 'string' ? message.text : message.text}
        </div>
      )}

      <form
        onSubmit={handleAddScheme}
        className="bg-white p-8 shadow-lg rounded-2xl w-full max-w-2xl mt-4"
      >
        {/* Scheme Name */}
        <label className="block text-gray-700 mb-2 font-semibold">Scheme Name:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter scheme name (e.g., PMAY-2025)"
          className="w-full p-3 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />

        {/* Total Funds */}
        <label className="block text-gray-700 mb-2 font-semibold">Total Funds (INR):</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Eg. 10000000"
          className="w-full p-3 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          min="0"
          step="0.01"
          required
        />

        {/* Eligibility Criteria */}
        <label className="block text-gray-700 mb-2 font-semibold">
          Eligibility Criteria <span className="text-gray-500 text-sm font-normal">(Optional)</span>:
        </label>
        <textarea
          value={eligibilityCriteria}
          onChange={(e) => setEligibilityCriteria(e.target.value)}
          placeholder="Enter eligibility criteria (e.g., Age: 18-60, Income: Below ₹3 Lakhs, etc.)"
          className="w-full p-3 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-none"
          rows="4"
        />

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 text-white rounded-lg font-semibold transition ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Adding Scheme..." : "Add Scheme"}
        </button>
      </form>
    </div>
  );
};

export default AddScheme;

