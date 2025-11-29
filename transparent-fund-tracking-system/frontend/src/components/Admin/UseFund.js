import React, { useState, useEffect } from "react";
import { executeUseFund, fetchSchemes } from "../../services/adminApi";
import { initBlockchain } from "../../services/blockchain";

const UseFund = () => {
  const [schemeId, setSchemeId] = useState("");
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [schemes, setSchemes] = useState([]);
  const [executor, setExecutor] = useState("");
  const [connected, setConnected] = useState(false);

  // Load schemes and get wallet address
  useEffect(() => {
    const loadData = async () => {
      try {
        // Connect wallet and get address
        if (window.ethereum) {
          const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
          if (accounts && accounts.length > 0) {
            setExecutor(accounts[0]);
            setConnected(true);
          }
          // Initialize blockchain connection
          await initBlockchain();
        } else {
          // Off-chain mode: no MetaMask available
          setExecutor("admin-offchain");
          setConnected(false);
        }
        
        // Load schemes
        const schemesList = await fetchSchemes();
        setSchemes(schemesList);
      } catch (error) {
        console.error("Error loading data:", error);
        // Allow DB-only mode even if wallet connection fails
        setExecutor(prev => prev || "admin-offchain");
        setMessage({ type: "error", text: "Wallet not connected. Proceeding in database-only mode." });
      }
    };
    loadData();
  }, []);

  // 🔹 Use fund for a specific scheme
  const handleUseFund = async (e) => {
    e.preventDefault();
    
    // If no wallet, proceed with off-chain executor
    const effectiveExecutor = executor || "admin-offchain";

    if (!schemeId || !amount) {
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
      const result = await executeUseFund(
        parseInt(schemeId),
        amountNum,
        effectiveExecutor,
        purpose || "Fund usage"
      );
      
      setMessage({
        type: "success",
        text: `✅ ${result.message || 'Fund used successfully!'} Transaction: ${result.txHash}`,
      });
      
      setSchemeId("");
      setAmount("");
      setPurpose("");
      
      // Refresh schemes list
      const updatedSchemes = await fetchSchemes();
      setSchemes(updatedSchemes);
    } catch (error) {
      console.error("Error using fund:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || error.message || "Failed to use fund. Please try again.",
      });
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center bg-gray-100 min-h-screen p-10">
      <h1 className="text-3xl font-bold mb-6 text-blue-700">Use Scheme Funds</h1>

      {/* Wallet Status */}
      {connected && executor ? (
        <div className="bg-green-100 text-green-800 p-3 rounded-lg mb-4 border border-green-300">
          ✅ Wallet Connected: {executor.substring(0, 6)}...{executor.substring(38)}
        </div>
      ) : (
        <div className="bg-yellow-100 text-yellow-800 p-3 rounded-lg mb-4 border border-yellow-300">
          ⚠️ MetaMask not connected. Operating in database-only mode.
        </div>
      )}

      {/* Message Display */}
      {message.text && (
        <div
          className={`w-96 p-4 rounded-lg mb-4 ${
            message.type === "success"
              ? "bg-green-100 text-green-800 border border-green-300"
              : "bg-red-100 text-red-800 border border-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      <form
        onSubmit={handleUseFund}
        className="bg-white p-8 shadow-lg rounded-2xl w-96 mt-4"
      >
        <label className="block text-gray-700 mb-2 font-semibold">Select Scheme:</label>
        <select
          value={schemeId}
          onChange={(e) => setSchemeId(e.target.value)}
          className="w-full p-3 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">-- Select a scheme --</option>
          {schemes.map((scheme) => (
            <option key={scheme.id} value={scheme.id}>
              {scheme.name} (ID: {scheme.id}) - Available: ₹{(scheme.totalFunds - scheme.usedFunds).toLocaleString()}
            </option>
          ))}
        </select>

        <label className="block text-gray-700 mb-2 font-semibold">Amount to Use (INR):</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
          className="w-full p-3 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          min="0"
          step="0.01"
          required
        />

        <label className="block text-gray-700 mb-2 font-semibold">Purpose (Optional):</label>
        <textarea
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          placeholder="Enter purpose for fund usage"
          className="w-full p-3 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
        />

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 text-white rounded-lg font-semibold transition ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Processing Transaction..." : "Use Fund"}
        </button>
      </form>
    </div>
  );
};

export default UseFund;
