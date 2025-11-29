import axios from "axios";

const API_BASE = `${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/public`;

// Get all active schemes with budgets
export async function fetchPublicSchemes(filters = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.schemeId) params.append('schemeId', filters.schemeId);
  if (filters.minBudget) params.append('minBudget', filters.minBudget);
  if (filters.maxBudget) params.append('maxBudget', filters.maxBudget);
  
  const res = await axios.get(`${API_BASE}/schemes?${params.toString()}`);
  return res.data;
}

// Get public transaction history
export async function fetchPublicTransactions(filters = {}) {
  const params = new URLSearchParams();
  if (filters.schemeId) params.append('schemeId', filters.schemeId);
  if (filters.fromDate) params.append('fromDate', filters.fromDate);
  if (filters.toDate) params.append('toDate', filters.toDate);
  if (filters.minAmount) params.append('minAmount', filters.minAmount);
  if (filters.maxAmount) params.append('maxAmount', filters.maxAmount);
  if (filters.search) params.append('search', filters.search);
  
  const res = await axios.get(`${API_BASE}/transactions?${params.toString()}`);
  return res.data;
}

// Submit grievance
export async function submitGrievance(formData) {
  const res = await axios.post(`${API_BASE}/grievance`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return res.data;
}

// Get grievances
export async function fetchGrievances(filters = {}) {
  const params = new URLSearchParams();
  if (filters.submittedBy) params.append('submittedBy', filters.submittedBy);
  if (filters.status) params.append('status', filters.status);
  if (filters.category) params.append('category', filters.category);
  
  const res = await axios.get(`${API_BASE}/grievances?${params.toString()}`);
  return res.data;
}

// Download report
export async function downloadReport(type, format = 'csv') {
  const res = await axios.get(`${API_BASE}/report?type=${type}&format=${format}`, {
    responseType: format === 'csv' ? 'blob' : 'json'
  });
  return res.data;
}

