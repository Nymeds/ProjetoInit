import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api, { getApiErrorMessage, setSignOutHandler } from "../services/api";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MEMBER";
}

interface AuthContextData {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextData | undefined>(undefined);
const TOKEN_STORAGE_KEYS = ["token", "@token", "@app:token", "@ignite:token", "access_token"] as const;
const REFRESH_STORAGE_KEYS = ["@refreshToken", "refreshToken", "@app:refreshToken"] as const;

async function readStoredToken(): Promise<string> {
  for (const key of TOKEN_STORAGE_KEYS) {
    const value = await AsyncStorage.getItem(key);
    if (value) return value;
  }
  return "";
}

async function clearStoredAuth(): Promise<void> {
  const allKeys = [...TOKEN_STORAGE_KEYS, ...REFRESH_STORAGE_KEYS, "@user"] as const;
  await AsyncStorage.multiRemove([...allKeys]);
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchUser(storedToken: string) {
    api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;

    try {
      const response = await api.get<{ user: User }>("/sessions/me");
      setUser(response.data.user);
      setToken(storedToken);
    } catch (error) {
      setUser(null);
      setToken(null);
      throw error;
    }
  }

  const logout = async () => {
    setUser(null);
    setToken(null);
    await clearStoredAuth();
    delete api.defaults.headers.common["Authorization"];
  };

  useEffect(() => {
    setSignOutHandler(async () => {
      await logout();
      setLoading(false);
    });

    return () => setSignOutHandler(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshUser = async () => {
    setLoading(true);

    try {
      const storedToken = await readStoredToken();
      if (!storedToken) {
        setUser(null);
        setToken(null);
        return;
      }

      await fetchUser(storedToken);
    } catch {
      await logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const response = await api.post<{ token: string; refreshToken?: string }>("/sessions", {
        email: normalizedEmail,
        password,
      });

      const newToken = response.data.token;
      const refreshToken = response.data.refreshToken;

      await AsyncStorage.setItem("token", newToken);
      await AsyncStorage.setItem("@token", newToken);
      if (refreshToken) {
        await AsyncStorage.setItem("@refreshToken", refreshToken);
      }

      api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
      const me = await api.get<{ user: User }>("/sessions/me");

      setUser(me.data.user);
      setToken(newToken);
      await AsyncStorage.setItem("@user", JSON.stringify(me.data.user));
    } catch (error) {
      await logout();
      throw new Error(getApiErrorMessage(error, "Erro ao conectar ao servidor"));
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedName) throw new Error("Nome e obrigatorio");
    if (!normalizedEmail) throw new Error("Email e obrigatorio");
    if (password.trim().length < 6) throw new Error("A senha precisa ter ao menos 6 caracteres");

    try {
      await api.post("/users", {
        name: normalizedName,
        email: normalizedEmail,
        password,
      });
    } catch (error) {
      throw new Error(getApiErrorMessage(error, "Erro ao cadastrar usuario"));
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshUser, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
