// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api, { setSignOutHandler } from "../services/api";

interface User { id: string; name: string; email: string; role: string; groups?: any[]; }
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

  // Logout — **sempre** garante setLoading(false)
  const logout = useCallback(async () => {
    try {
      console.log("[Auth] logout start");
      await AsyncStorage.multiRemove(["@token", "@refreshToken", "@user"]);
      delete api.defaults.headers.common["Authorization"];
      setUser(null);
    } catch (e) {
      console.error("[Auth] logout error", e);
      setUser(null);
    } finally {
      setLoading(false); // ESSENCIAL: evita loading preso
      console.log("[Auth] logout finished (loading false)");
    }
  }, []);

  // Registrar handler global que o axios chama
  useEffect(() => {
    setSignOutHandler(logout);
    return () => setSignOutHandler(() => {});
  }, [logout]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post("/sessions", { email, password });
    const { token, refreshToken } = res.data;
    if (!token) throw new Error("Login falhou");
    await AsyncStorage.setItem("@token", token);
    await AsyncStorage.setItem("@refreshToken", refreshToken);
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    const userRes = await api.get("/sessions/me");
    const userData = userRes.data.user || userRes.data;
    setUser(userData);
    await AsyncStorage.setItem("@user", JSON.stringify(userData));
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await api.post("/users", { name, email, password });
    return res.data;
  }, []);

  // refreshUser robusto: tenta token, se falhar tenta refresh, sempre finaliza loading
  const refreshUser = useCallback(async () => {
    setLoading(true);
    console.log("[Auth] refreshUser start");
    try {
      const token = await AsyncStorage.getItem("@token");
      const refreshToken = await AsyncStorage.getItem("@refreshToken");
      console.log("[Auth] tokens:", !!token, !!refreshToken);

      // se não tiver nenhum token, garante que user fique null
      if (!token && !refreshToken) {
        setUser(null);
        return;
      }

      // se houver token, tenta usar
      if (token) {
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        try {
          const userRes = await api.get("/sessions/me");
          const userData = userRes.data.user || userRes.data;
          setUser(userData);
          await AsyncStorage.setItem("@user", JSON.stringify(userData));
          console.log("[Auth] refreshUser ok with token");
          return;
        } catch (e) {
          console.warn("[Auth] /sessions/me failed with token, will try refresh");
        }
      }

      // tenta refresh se houver refreshToken
      if (refreshToken) {
        try {
          const r = await api.patch<{ token: string; refreshToken: string }>("/token/refresh", {
            refreshToken,
          });
          const { token: newToken, refreshToken: newRefreshToken } = r.data;
          await AsyncStorage.setItem("@token", newToken);
          await AsyncStorage.setItem("@refreshToken", newRefreshToken);
          api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;

          const userRes = await api.get("/sessions/me");
          const userData = userRes.data.user || userRes.data;
          setUser(userData);
          await AsyncStorage.setItem("@user", JSON.stringify(userData));
          console.log("[Auth] refreshUser ok with refreshToken");
          return;
        } catch (e) {
          console.warn("[Auth] refresh token failed:", (e as any)?.message ?? e);
          // se refresh falhar, faz logout
          await AsyncStorage.multiRemove(["@token", "@refreshToken", "@user"]);
          setUser(null);
          return;
        }
      }

      // fallback
      setUser(null);
    } catch (err) {
      console.error("[Auth] refreshUser unexpected error:", err);
      setUser(null);
    } finally {
      setLoading(false);
      console.log("[Auth] refreshUser finished (loading false)");
    }
  }, []);

  useEffect(() => {
    // delay pequeno para evitar micro-race na inicialização
    const t = setTimeout(() => refreshUser(), 10);
    return () => clearTimeout(t);
  }, [refreshUser]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
