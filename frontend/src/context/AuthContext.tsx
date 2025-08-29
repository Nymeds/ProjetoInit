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

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");

    const fetchUser = async () => {
      if (storedToken) {
        setToken(storedToken);
        api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;

        try {
          const { data } = await api.get("/sessions/me");
          setUser(data.user);
        } catch (err) {
          console.error("Erro ao buscar usuário:", err);
          setUser(null);
          localStorage.removeItem("token");
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
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
      console.error("Erro ao logar:", err);
      setUser(null);
      localStorage.removeItem("token");
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
