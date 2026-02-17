import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from "axios";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:3333";
const TOKEN_STORAGE_KEYS = ["token", "@token", "@app:token", "@ignite:token", "access_token"] as const;
const REFRESH_STORAGE_KEYS = ["@refreshToken", "refreshToken", "@app:refreshToken"] as const;

interface ApiErrorResponse {
  message?: string;
}

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];
let signOutHandler: (() => void | Promise<void>) | null = null;

export const setSignOutHandler = (handler: () => void | Promise<void>) => {
  signOutHandler = handler;
};

async function readStoredToken(): Promise<string> {
  for (const key of TOKEN_STORAGE_KEYS) {
    const value = await AsyncStorage.getItem(key);
    if (value) return value;
  }
  return "";
}

async function readStoredRefreshToken(): Promise<string> {
  for (const key of REFRESH_STORAGE_KEYS) {
    const value = await AsyncStorage.getItem(key);
    if (value) return value;
  }
  return "";
}

async function clearStoredAuth(): Promise<void> {
  const allKeys = [...TOKEN_STORAGE_KEYS, ...REFRESH_STORAGE_KEYS, "@user"] as const;
  await AsyncStorage.multiRemove([...allKeys]);
}

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((pending) => {
    if (error) pending.reject(error);
    else pending.resolve(token ?? "");
  });
  failedQueue = [];
}

export function getApiErrorMessage(error: unknown, fallbackMessage: string): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const responseMessage = error.response?.data?.message;
    if (typeof responseMessage === "string" && responseMessage.trim() !== "") {
      return responseMessage;
    }
    if (typeof error.message === "string" && error.message.trim() !== "") {
      return error.message;
    }
  }

  if (error instanceof Error && error.message.trim() !== "") {
    return error.message;
  }

  return fallbackMessage;
}

export function toApiError(error: unknown, fallbackMessage: string): Error {
  return new Error(getApiErrorMessage(error, fallbackMessage));
}

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
  timeout: 10000,
});

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await readStoredToken();
  if (!token) return config;

  const headers = AxiosHeaders.from(config.headers);
  headers.set("Authorization", `Bearer ${token}`);
  config.headers = headers;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (!originalRequest) return Promise.reject(error);

    if (error.response?.status !== 401 || originalRequest._retry || originalRequest.url?.includes("/token/refresh")) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => failedQueue.push({ resolve, reject }))
        .then((newToken) => {
          const headers = AxiosHeaders.from(originalRequest.headers);
          headers.set("Authorization", `Bearer ${newToken}`);
          originalRequest.headers = headers;
          return api(originalRequest);
        });
    }

    isRefreshing = true;

    try {
      const refreshToken = await readStoredRefreshToken();
      if (!refreshToken) throw new Error("Sessao expirada");

      const refreshResponse = await api.patch<{ token: string; refreshToken?: string }>(
        "/token/refresh",
        { refreshToken },
      );

      const newToken = refreshResponse.data.token;
      const newRefreshToken = refreshResponse.data.refreshToken ?? refreshToken;

      await AsyncStorage.setItem("token", newToken);
      await AsyncStorage.setItem("@token", newToken);
      await AsyncStorage.setItem("@refreshToken", newRefreshToken);

      processQueue(null, newToken);

      const headers = AxiosHeaders.from(originalRequest.headers);
      headers.set("Authorization", `Bearer ${newToken}`);
      originalRequest.headers = headers;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      await clearStoredAuth();
      await signOutHandler?.();
      return Promise.reject(toApiError(refreshError, "Sessao expirada"));
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
