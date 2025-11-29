import React, { useEffect, useState } from "react";
import axios from "axios";

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTransactions();
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchTransactions, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
      const res = await axios.get(`${apiUrl}/api/transactions`);
      setTransactions(res.data);
      setError("");
    } catch (error) {
      console.error("Error fetching transactions", error);
      setError("Failed to load transactions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatAddress = (address) => {
    if (!address) return "N/A";
    return `${address.substring(0, 6)}...${address.substring(38)}`;
  };

  const getExplorerUrl = (txHash) => {
    // Check if it's a local network or testnet
    if (txHash.startsWith("0x")) {
      // For local Hardhat network
      return `#`;
    }
    return `https://sepolia.etherscan.io/tx/${txHash}`;
  };

  return (
    <div className="p-10 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-blue-700">
          Transaction History
        </h2>
        <button
          onClick={fetchTransactions}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? "Refreshing..." : "🔄 Refresh"}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-4 border border-red-300">
          ⚠️ {error}
        </div>
      )}

      {loading && transactions.length === 0 ? (
        <div className="text-center text-gray-600 py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2">Loading transactions...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center text-gray-600 py-10 bg-white rounded-lg shadow">
          <p className="text-xl">No transactions found.</p>
          <p className="text-sm mt-2">Transactions will appear here when funds are used.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white shadow-md rounded-xl">
          <table className="min-w-full">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="py-4 px-6 text-left">Scheme ID</th>
                <th className="py-4 px-6 text-right">Amount</th>
                <th className="py-4 px-6 text-left">Purpose</th>
                <th className="py-4 px-6 text-left">Executor</th>
                <th className="py-4 px-6 text-left">Transaction Hash</th>
                <th className="py-4 px-6 text-left">Date & Time</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, index) => (
                <tr
                  key={tx._id || index}
                  className="border-b hover:bg-gray-50 transition"
                >
                  <td className="py-4 px-6">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                      {tx.schemeId}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right font-semibold text-green-700">
                    {formatCurrency(tx.amount)}
                  </td>
                  <td className="py-4 px-6">{tx.purpose || "Fund usage"}</td>
                  <td className="py-4 px-6">
                    <span className="font-mono text-sm">
                      {formatAddress(tx.executor)}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <a
                      href={getExplorerUrl(tx.txHash)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline font-mono text-sm"
                    >
                      {formatAddress(tx.txHash)}
                    </a>
                  </td>
                  <td className="py-4 px-6 text-gray-600">
                    {tx.createdAt
                      ? new Date(tx.createdAt).toLocaleString("en-IN", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })
                      : tx.timestamp
                      ? new Date(tx.timestamp).toLocaleString("en-IN", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })
                      : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {transactions.length > 0 && (
        <div className="mt-4 text-sm text-gray-600 text-center">
          Total Transactions: <strong>{transactions.length}</strong>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;
