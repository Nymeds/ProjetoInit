// src/services/api.ts
import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const api = axios.create({
  baseURL: "http://10.0.2.2:3333",
  headers: { "Content-Type": "application/json" },
  timeout: 8000, // evita requests pendurados
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

    // Se não for um request com config, rejeita
    if (!originalRequest) return Promise.reject(error);

    const status = error.response?.status;

    // Proteção: não tentamos refresh se estivermos já na rota /token/refresh
    const isRefreshEndpoint = originalRequest.url?.includes("/token/refresh");

    if (status === 401 && !originalRequest._retry) {
      // se o request era o próprio refresh, não tentamos de novo (evita loop)
      if (isRefreshEndpoint) {
        // logout imediato — ninguém deve continuar com token inválido
        if (signOutHandler) signOutHandler();
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      if (isRefreshing) {
        // já tem refresh em progresso, enfileira
        return new Promise<AxiosResponse>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers!["Authorization"] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        const refreshToken = await AsyncStorage.getItem("@refreshToken");
        if (!refreshToken) {
          // sem refresh token — logout
          if (signOutHandler) signOutHandler();
          return Promise.reject(error);
        }

        // pedir novo token
        const r = await api.patch<{ token: string; refreshToken: string }>(
          "/token/refresh",
          { refreshToken },
          { timeout: 8000 } // timeout extra para o refresh
        );

        const { token: newToken, refreshToken: newRefreshToken } = r.data;

        // salva tokens
        await AsyncStorage.setItem("@token", newToken);
        await AsyncStorage.setItem("@refreshToken", newRefreshToken);

        processQueue(null, newToken);

        originalRequest.headers!["Authorization"] = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (err) {
        // se refresh falhar, limpa fila e faz logout
        processQueue(err, null);
        if (signOutHandler) signOutHandler();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
