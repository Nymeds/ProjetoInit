import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../services/api";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  groups?: any[];
}

interface AuthContextData {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refreshUser();
  }, []);

  const extractErrorMessage = (err: any): string => {
    const fallback = err?.message || "Erro desconhecido";
    const data = err?.response?.data;

    if (!data) return fallback;

    let msg = data.message;

    if (typeof msg === "string") {
      try {
        const arr = JSON.parse(msg);
        if (Array.isArray(arr)) {
          const messages = arr.map((item: any) => item?.message).filter(Boolean);
          if (messages.length) return messages.join("\n");
        }
        return msg;
      } catch {
        return msg;
      }
    }

    if (Array.isArray(msg)) {
      const messages = msg.map((item: any) => item?.message).filter(Boolean);
      if (messages.length) return messages.join("\n");
    }

    return fallback;
  };

  const login = async (email: string, password: string) => {
  try {
    const response = await api.post("/sessions", { email, password });
    const { token, refreshToken } = response.data;

    if (!token) throw new Error("Login falhou");

    // Salva tokens no AsyncStorage
    await AsyncStorage.setItem("@token", token);
    if (refreshToken) await AsyncStorage.setItem("@refreshToken", refreshToken);

    // Define o header Authorization no axios ANTES de chamar /sessions/me
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    // Agora busca os dados do usuário com o token aplicado
    const userResponse = await api.get("/sessions/me");
    const userData = userResponse.data.user || userResponse.data;

    await AsyncStorage.setItem("@user", JSON.stringify(userData));
    setUser(userData);
  } catch (err: any) {
    throw new Error(extractErrorMessage(err));
  }
};



  const register = async (name: string, email: string, password: string) => {
  try {
    const response = await api.post("/users", { name, email, password });
    return response.data; 
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
};


  const refreshUser = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("@token");
      if (!token) {
        setUser(null);
        return;
      }

      const response = await api.get("/sessions/me");
      setUser(response.data.user || response.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(["@token", "@refreshToken", "@user"]);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
