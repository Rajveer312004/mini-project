import axios from "axios";

const API_BASE = `${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/admin`;

export async function fetchAdminStats() {
  const res = await axios.get(`${API_BASE}/stats`);
  return res.data;
}

export async function fetchSchemes() {
  const res = await axios.get(`${API_BASE}/schemes`);
  return res.data;
}

export async function addScheme(name, amount, eligibilityCriteria = "") {
  const res = await axios.post(`${API_BASE}/add-scheme`, { 
    name, 
    amount, 
    eligibilityCriteria 
  });
  return res.data;
}

export async function executeUseFund(schemeId, amount, executor, purpose) {
  const res = await axios.post(`${API_BASE}/use-fund`, { schemeId, amount, executor, purpose });
  return res.data;
}

export async function fetchRecentActivities() {
  // recentActivities is included in stats response
  const stats = await fetchAdminStats();
  return stats.recentActivities || [];
}

// Grievance management
export async function fetchGrievances(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.category) params.append('category', filters.category);
  if (filters.search) params.append('search', filters.search);
  if (filters.submittedBy) params.append('submittedBy', filters.submittedBy);

  const queryString = params.toString();
  const url = `${API_BASE}/grievances${queryString ? `?${queryString}` : ''}`;
  const res = await axios.get(url);
  return res.data;
}

export async function updateGrievanceStatus(grievanceId, status, reviewNotes = '', reviewedBy = '') {
  const res = await axios.put(`${API_BASE}/grievances/${grievanceId}`, {
    status,
    reviewNotes,
    reviewedBy
  });
  return res.data;
}
