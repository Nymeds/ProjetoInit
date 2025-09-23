import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../services/api";
import { useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  groups?: any[];
}

export function useAuthActions() {
  const [user, setUser] = useState<User | null>(null);

  const setTokens = async (token: string, refreshToken?: string) => {
    await AsyncStorage.setItem("@token", token);
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    if (refreshToken) await AsyncStorage.setItem("@refreshToken", refreshToken);
  };

  const removeTokens = async () => {
    await AsyncStorage.multiRemove(["@token", "@refreshToken", "@user"]);
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
  };

  const extractErrorMessage = (err: any) => {
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
      // login retorna apenas token e refreshToken
      const response = await api.post("/sessions", { email, password });
      const { token, refreshToken } = response.data;

      if (!token) throw new Error("Login falhou");

      await setTokens(token, refreshToken);

      // buscar os dados do usuário
      const userResponse = await api.get("/sessions/me");
      const userData = userResponse.data.user || userResponse.data;

      await AsyncStorage.setItem("@user", JSON.stringify(userData));
      setUser(userData);

      return userData;
    } catch (err: any) {
      throw new Error(extractErrorMessage(err));
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await api.post("/users", { name, email, password });
      return response.data;
    } catch (err: any) {
      throw new Error(extractErrorMessage(err));
    }
  };

  const logout = async () => {
    await removeTokens();
  };

  const refreshUser = async () => {
    try {
      const response = await api.get("/sessions/me");
      const userData = response.data.user || response.data;
      await AsyncStorage.setItem("@user", JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (err: any) {
      await removeTokens();
      throw new Error(extractErrorMessage(err));
    }
  };

  return { user, setUser, login, register, logout, refreshUser };
}
