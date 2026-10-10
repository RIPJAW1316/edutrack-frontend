import axios from "axios";

// Set VITE_API_URL at build time for deployments (e.g. https://edutrack-api-ripjaw.onrender.com)
export const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:8081").replace(/\/+$/, "");
export const API_HOST = API_BASE_URL.replace(/^https?:\/\//, "");
export const IS_LOCAL_API = /^(localhost|127\.0\.0\.1)(:|$)/.test(API_HOST);
export const API_DOWN_HINT = IS_LOCAL_API
  ? `The API on ${API_HOST} isn't responding. Start the Spring Boot backend, then retry.`
  : `The API at ${API_HOST} isn't responding. The free server may still be waking up — retry in a minute.`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token automatically to every request if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("edutrack_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle session expiration / 401s
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Login failures are 401s too — only treat 401s on authenticated calls as session loss
    const isLoginCall = error.config?.url?.includes("/students/login");
    if (error.response && error.response.status === 401 && !isLoginCall) {
      // Clear token on 401 unauthorized
      localStorage.removeItem("edutrack_token");
      localStorage.removeItem("edutrack_user");
      window.dispatchEvent(new CustomEvent("edutrack:unauthorized"));
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (credentials) => {
    const response = await api.post("/students/login", credentials);
    if (response.data && response.data.token) {
      localStorage.setItem("edutrack_token", response.data.token);
      localStorage.setItem(
        "edutrack_user",
        JSON.stringify({
          id: response.data.id,
          email: response.data.email,
          role: response.data.role,
        })
      );
    }
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post("/students/register", userData);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem("edutrack_token");
    localStorage.removeItem("edutrack_user");
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem("edutrack_user");
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  isAuthenticated: () => {
    return !!localStorage.getItem("edutrack_token");
  },
};

export const studentService = {
  getAll: async () => {
    const res = await api.get("/students");
    return res.data;
  },

  getByDepartment: async (deptId) => {
    const res = await api.get(`/students/department/${deptId}`);
    return res.data;
  },

  getById: async (id) => {
    const res = await api.get(`/students/${id}`);
    return res.data;
  },

  create: async (studentData) => {
    const res = await api.post("/students/register", studentData);
    return res.data;
  },

  update: async (id, studentData) => {
    const res = await api.put(`/students/${id}`, studentData);
    return res.data;
  },

  delete: async (id) => {
    const res = await api.delete(`/students/${id}`);
    return res.data;
  },
};

export const departmentService = {
  getAll: async () => {
    const res = await api.get("/departments");
    return res.data;
  },

  getById: async (id) => {
    const res = await api.get(`/departments/${id}`);
    return res.data;
  },

  create: async (deptData) => {
    const res = await api.post("/departments", deptData);
    return res.data;
  },

  update: async (id, deptData) => {
    const res = await api.put(`/departments/${id}`, deptData);
    return res.data;
  },

  delete: async (id) => {
    const res = await api.delete(`/departments/${id}`);
    return res.data;
  },
};

export default api;
