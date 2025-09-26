import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

const api = axios.create({
  baseURL: "http://10.0.2.2:3333",
  headers: { "Content-Type": "application/json" },
  timeout: 8000,
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

let signOutHandler: (() => void) | null = null;
export const setSignOutHandler = (fn: () => void) => {
  signOutHandler = fn;
};

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token!);
  });
  failedQueue = [];
};

// Request interceptor
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await AsyncStorage.getItem("@token");
      if (token) {
        config.headers = config.headers ?? {};
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn("[api] request interceptor error:", e);
    }
    return config;
  },
  (err) => Promise.reject(err)
);

// Response interceptor (refresh flow)
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (!originalRequest) return Promise.reject(error);

    const status = error.response?.status;
    const isRefreshEndpoint = originalRequest.url?.includes("/token/refresh");

    if (status === 401 && !originalRequest._retry) {
      if (isRefreshEndpoint) {
        if (signOutHandler) signOutHandler();
        Alert.alert("Sessão expirada", "Sua sessão expirou. Faça login novamente.");
        return Promise.reject(new Error("Sessão expirada"));
      }

      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            originalRequest.headers!["Authorization"] = `Bearer ${newToken}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        const refreshToken = await AsyncStorage.getItem("@refreshToken");
        if (!refreshToken) {
          if (signOutHandler) signOutHandler();
          Alert.alert("Sessão expirada", "Sua sessão expirou. Faça login novamente.");
          return Promise.reject(new Error("Sessão expirada"));
        }

        const r = await api.patch<{ token: string; refreshToken: string }>(
          "/token/refresh",
          { refreshToken },
          { timeout: 8000 }
        );

        const { token: newToken, refreshToken: newRefreshToken } = r.data;

        await AsyncStorage.setItem("@token", newToken);
        await AsyncStorage.setItem("@refreshToken", newRefreshToken);

        processQueue(null, newToken);

        originalRequest.headers!["Authorization"] = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        if (signOutHandler) signOutHandler();
        Alert.alert("Sessão expirada", "Sua sessão expirou. Faça login novamente.");
        return Promise.reject(new Error("Sessão expirada"));
      } finally {
        isRefreshing = false;
      }
    }

    // Outros erros que não sejam 401
    return Promise.reject(error);
  }
);

export default api;
