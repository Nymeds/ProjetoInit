/* eslint-disable react-refresh/only-export-components */
import { createContext, type ReactNode, useState, useEffect } from "react";
import { loginRequest, api } from "../api/auth";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MEMBER";
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Função para chamar o refresh token
  async function refreshToken() {
    try {
      const response = await api.patch("/token/refresh"); 
      const newToken = response.data.token;
      localStorage.setItem("token", newToken);
      api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
      return newToken;
    } catch (err) {
      logout();
      throw err;
    }
  }

  // Interceptor para lidar com 401
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const newToken = await refreshToken();
            originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
            return api.request(originalRequest);
          } catch {
            return Promise.reject(error);
          }
        }
        return Promise.reject(error);
      }
    );
    return () => api.interceptors.response.eject(interceptor);
  }, []);

  // Carregar usuário ao iniciar
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const fetchUser = async () => {
      if (storedToken) {
        setToken(storedToken);
        api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
        try {
          const { data } = await api.get("/sessions/me");
          setUser(data.user);
        } catch {
          setUser(null);
          localStorage.removeItem("token");
        }
      }
      setIsLoading(false);
    };
    fetchUser();
  }, []);

  async function login(email: string, password: string) {
    setIsLoading(true);
    try {
      const { token } = await loginRequest(email, password);
      localStorage.setItem("token", token);
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      const { data } = await api.get("/sessions/me");
      setUser(data.user);
      setToken(token);
    } catch (err) {
      logout();
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  function logout() {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    delete api.defaults.headers.common["Authorization"];
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
