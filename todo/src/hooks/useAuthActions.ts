import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api, { getApiErrorMessage } from "../services/api";
import { useError } from "../context/ErrorContext";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  groups?: unknown[];
}

export function useAuthActions() {
  const [user, setUser] = useState<User | null>(null);
  const { showError } = useError();

  const setTokens = async (token: string, refreshToken?: string) => {
    await AsyncStorage.setItem("@token", token);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;

    if (refreshToken) {
      await AsyncStorage.setItem("@refreshToken", refreshToken);
    }
  };

  const removeTokens = async () => {
    await AsyncStorage.multiRemove(["@token", "@refreshToken", "@user"]);
    delete api.defaults.headers.common.Authorization;
    setUser(null);
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post("/sessions", { email, password });
      const { token, refreshToken } = response.data as { token?: string; refreshToken?: string };

      if (!token) {
        throw new Error("Login falhou");
      }

      await setTokens(token, refreshToken);

      const userResponse = await api.get("/sessions/me");
      const userData = (userResponse.data.user ?? userResponse.data) as User;

      await AsyncStorage.setItem("@user", JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (error) {
      showError(getApiErrorMessage(error, "Falha ao autenticar"));
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await api.post("/users", { name, email, password });
      return response.data;
    } catch (error) {
      showError(getApiErrorMessage(error, "Falha ao cadastrar usuario"));
      throw error;
    }
  };

  const logout = async () => {
    await removeTokens();
  };

  const refreshUser = async () => {
    try {
      const response = await api.get("/sessions/me");
      const userData = (response.data.user ?? response.data) as User;
      await AsyncStorage.setItem("@user", JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (error) {
      await removeTokens();
      showError(getApiErrorMessage(error, "Falha ao atualizar sessao"));
      throw error;
    }
  };

  return { user, setUser, login, register, logout, refreshUser };
}
