import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ✅ Add /api at the end of your ngrok link
const BASE_URL = "https://zena-stalky-tenuously.ngrok-free.dev/api"; 

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

/* ================= REQUEST INTERCEPTOR ================= */
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* ================= RESPONSE INTERCEPTOR ================= */
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await AsyncStorage.getItem("refresh_token");
        if (!refreshToken) throw new Error("No refresh token available");

        // Using the static BASE_URL ensures we stay on the 10.0.2.2 bridge
        const response = await axios.post(`${BASE_URL}/auth/token/refresh/`, {
          refresh: refreshToken,
        });

        const newAccess = response.data.access; 
        await AsyncStorage.setItem("access_token", newAccess);
  
        processQueue(null, newAccess);
        
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);
        
      } catch (refreshError) {
        processQueue(refreshError, null);
        await AsyncStorage.multiRemove(["access_token", "refresh_token"]);
        console.log("Session expired, please login again.");
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;