import axios from "axios";

const API_BASE = `${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/auth`;

// Get token from localStorage
const getToken = () => {
  return localStorage.getItem("public_token");
};

// Set token in localStorage
const setToken = (token) => {
  localStorage.setItem("public_token", token);
};

// Remove token from localStorage
const removeToken = () => {
  localStorage.removeItem("public_token");
};

// Create axios instance with auth header
const api = axios.create({
  baseURL: API_BASE,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Sign up new public user
export async function signup(userData) {
  const res = await axios.post(`${API_BASE}/signup`, {
    ...userData,
    role: "public"
  });
  if (res.data.token) {
    setToken(res.data.token);
  }
  return res.data;
}

// Sign in existing user
export async function signin(email, password) {
  const res = await axios.post(`${API_BASE}/signin`, { email, password });
  if (res.data.token) {
    setToken(res.data.token);
  }
  return res.data;
}

// Get user profile
export async function getProfile() {
  const token = getToken();
  if (!token) {
    throw new Error("No token found");
  }
  const res = await axios.get(`${API_BASE}/profile`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

// Update user profile
export async function updateProfile(profileData) {
  const token = getToken();
  if (!token) {
    throw new Error("No token found");
  }
  const res = await axios.put(`${API_BASE}/profile`, profileData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

// Sign out
export function signout() {
  removeToken();
}

// Check if user is authenticated
export function isAuthenticated() {
  return !!getToken();
}

export { getToken, setToken, removeToken };

