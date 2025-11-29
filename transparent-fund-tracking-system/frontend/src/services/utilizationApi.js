import axios from "axios";
import { getToken } from "./authApi";

const API_BASE = `${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/utilization`;

// Create axios instance with auth interceptor
const api = axios.create({
  baseURL: API_BASE,
});

// Add token to all requests
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors (unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("utilization_token");
      window.location.href = "/utilization/signin";
    }
    return Promise.reject(error);
  }
);

// Submit fund utilization request with supporting documentation
export async function submitUtilizationRequest(formData) {
  const res = await api.post("/request", formData);
  return res.data;
}

// Get all utilization requests
export async function fetchUtilizationRequests(filters = {}) {
  const params = new URLSearchParams();
  if (filters.schemeId) params.append('schemeId', filters.schemeId);
  if (filters.status) params.append('status', filters.status);
  
  const res = await api.get(`/requests?${params.toString()}`);
  return res.data;
}

// Get single utilization request with details
export async function fetchUtilizationRequest(id) {
  const res = await api.get(`/requests/${id}`);
  return res.data;
}

// Approve utilization request (admin only - not used in frontend but kept for consistency)
export async function approveRequest(id, approvedBy) {
  const res = await api.put(`/requests/${id}/approve`, { approvedBy });
  return res.data;
}

// Reject utilization request (admin only - not used in frontend but kept for consistency)
export async function rejectRequest(id, rejectionReason, rejectedBy) {
  const res = await api.put(`/requests/${id}/reject`, { rejectionReason, rejectedBy });
  return res.data;
}

// Record expenditure against request
export async function recordExpenditure(id, formData) {
  const res = await api.post(`/requests/${id}/expenditure`, formData);
  return res.data;
}

// Get expenditures for a request
export async function fetchExpenditures(id) {
  const res = await api.get(`/requests/${id}/expenditures`);
  return res.data;
}

// Upload proof of work completion
export async function uploadProof(id, formData) {
  const res = await api.post(`/requests/${id}/proof`, formData);
  return res.data;
}

// Get proofs for a request
export async function fetchProofs(id) {
  const res = await api.get(`/requests/${id}/proofs`);
  return res.data;
}

// Mark request as completed
export async function completeRequest(id) {
  const res = await api.put(`/requests/${id}/complete`);
  return res.data;
}

// Generate utilization certificate
export async function generateCertificate(id) {
  const res = await api.post(`/requests/${id}/certificate`);
  return res.data;
}

// Get certificate for a request
export async function fetchCertificate(id) {
  const res = await api.get(`/requests/${id}/certificate`);
  return res.data;
}

