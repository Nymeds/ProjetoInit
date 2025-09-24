import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api, { setSignOutHandler } from "../services/api";

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

  
  const logout = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove(["@token", "@refreshToken", "@user"]);
      
      try {
        delete api.defaults.headers.common["Authorization"];
      } catch {}
      setUser(null);
      console.log("[Auth] logout executed");
    } catch (err) {
      console.error("[Auth] logout error:", err);
      setUser(null);
    }
  }, []);

 
  useEffect(() => {
    setSignOutHandler(logout);
    return () => {
      
      setSignOutHandler(() => {});
    };
  }, [logout]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await api.post("/sessions", { email, password });
      const { token, refreshToken } = response.data;
      if (!token) throw new Error("Login falhou");
      await AsyncStorage.setItem("@token", token);
      if (refreshToken) await AsyncStorage.setItem("@refreshToken", refreshToken);
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      const userResponse = await api.get("/sessions/me");
      const userData = userResponse.data.user || userResponse.data;

      await AsyncStorage.setItem("@user", JSON.stringify(userData));
      setUser(userData);
      console.log("[Auth] login success");
    } catch (err: any) {
      console.error("[Auth] login error:", err);
      throw new Error(extractErrorMessage(err));
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    try {
      const response = await api.post("/users", { name, email, password });
      return response.data;
    } catch (err: any) {
      throw new Error(extractErrorMessage(err));
    }
  }, []);

  
  const refreshUser = useCallback(async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("@token");
      if (!token) {
        setUser(null);
        return;
      }

      
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      const response = await api.get("/sessions/me");
      const userData = response.data.user || response.data;
      setUser(userData);
      await AsyncStorage.setItem("@user", JSON.stringify(userData));
      console.log("[Auth] refreshUser success");
    } catch (err: any) {
      console.warn("[Auth] refreshUser failed; clearing auth:", err?.message ?? err);
      try {
        
        await AsyncStorage.multiRemove(["@token", "@refreshToken", "@user"]);
        try {
          delete api.defaults.headers.common["Authorization"];
        } catch {}
      } catch (e) {
        console.error("[Auth] error clearing tokens:", e);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
