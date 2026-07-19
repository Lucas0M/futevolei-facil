import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  getCurrentUserRequest,
  loginRequest,
  registerRequest,
  logoutRequest,
  type LoginPayload,
  type RegisterPayload,
} from "../api/auth.api";
import type { User } from "../types/api.types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_USER_KEY = "user";
const STORAGE_TOKEN_KEY = "token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // Starts true so routes can wait for the stored session to be read
  // before deciding whether to redirect to /login.
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem(STORAGE_TOKEN_KEY);

    async function hydrateSession() {
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser = await getCurrentUserRequest();
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(currentUser));
        setUser(currentUser);
      } catch {
        localStorage.removeItem(STORAGE_USER_KEY);
        localStorage.removeItem(STORAGE_TOKEN_KEY);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    const storedUser = localStorage.getItem(STORAGE_USER_KEY);
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }
    hydrateSession();
  }, []);

  const persistSession = (nextUser: User, token: string) => {
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(nextUser));
    localStorage.setItem(STORAGE_TOKEN_KEY, token);
    setUser(nextUser);
  };

  const login = useCallback(async (payload: LoginPayload) => {
    const result = await loginRequest(payload);
    persistSession(result.user, result.token);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const result = await registerRequest(payload);
    persistSession(result.user, result.token);
  }, []);

  const logout = useCallback(() => {
    logoutRequest().catch((err) => console.error("Failed to log out from backend:", err));
    localStorage.removeItem(STORAGE_USER_KEY);
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
