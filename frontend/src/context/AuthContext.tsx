/* eslint-disable @typescript-eslint/no-explicit-any */
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

  async function fetchUser(storedToken: string) {
    api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
    try {
      const { data } = await api.get("/sessions/me");
      setUser(data.user);
      setToken(storedToken);
    } catch (err: any) {
      if (err.response?.status === 401) {
        // Tenta refresh
        try {
          const { data } = await api.patch("/token/refresh", {}, { withCredentials: true });
          const { token: newToken } = data;
          localStorage.setItem("token", newToken);
          api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
          const { data: me } = await api.get("/sessions/me");
          setUser(me.user);
          setToken(newToken);
        } catch {
          logout();
        }
      } else {
        logout();
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) fetchUser(storedToken);
    else setIsLoading(false);
  }, []);

  async function login(email: string, password: string) {
    setIsLoading(true);
    try {
      const { token: newToken } = await loginRequest(email, password);
      localStorage.setItem("token", newToken);
      api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
      const { data } = await api.get("/sessions/me");
      setUser(data.user);
      setToken(newToken);
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
