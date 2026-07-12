"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface UserProfile {
  id: number;
  email: string;
  full_name: string;
  role: {
    id: number;
    name: string;
  };
}

// module -> "full" | "view" | "none"
type PermissionMap = Record<string, string>;

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  permissions: PermissionMap;
  loading: boolean;
  login: (form: FormData) => Promise<void>;
  registerUser: (email: string, password: string, fullName: string, roleName: string) => Promise<void>;
  verifyOtpAndLogin: (email: string, otpCode: string) => Promise<void>;
  logout: () => void;
  hasPermission: (module: string, minLevel?: "view" | "full") => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Role → default landing page
const ROLE_DEFAULT_ROUTES: Record<string, string> = {
  "Fleet Manager": "/dashboard/vehicles",
  "Dispatcher": "/dashboard",
  "Safety Officer": "/dashboard/drivers",
  "Financial Analyst": "/dashboard/reports",
  "Driver": "/dashboard/trips",
};

const LEVEL_SCORE: Record<string, number> = { none: 0, view: 1, full: 2 };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<PermissionMap>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchPermissions = async (): Promise<PermissionMap> => {
    try {
      const perms = await api.get<PermissionMap>("/auth/permissions");
      return perms;
    } catch {
      return {};
    }
  };

  useEffect(() => {
    async function loadStoredAuth() {
      const storedToken = localStorage.getItem("transitops_token");
      if (storedToken) {
        setToken(storedToken);
        try {
          const userProfile = await api.get<UserProfile>("/auth/me");
          setUser(userProfile);
          const perms = await fetchPermissions();
          setPermissions(perms);
        } catch (error) {
          // Token is likely invalid or expired. Use warn instead of error to avoid Next.js dev overlay.
          console.warn("Failed to load user profile: token might be expired.");
          localStorage.removeItem("transitops_token");
          setToken(null);
          setUser(null);
          setPermissions({});
        }
      }
      setLoading(false);
    }
    loadStoredAuth();
  }, []);

  const login = async (formData: FormData) => {
    setLoading(true);
    try {
      const data = await api.post<{ access_token: string; role: string; email: string }>("/auth/login", formData, true);
      localStorage.setItem("transitops_token", data.access_token);
      setToken(data.access_token);

      const userProfile = await api.get<UserProfile>("/auth/me");
      setUser(userProfile);

      const perms = await fetchPermissions();
      setPermissions(perms);
      setLoading(false);

      // Route to role-specific default page
      const defaultRoute = ROLE_DEFAULT_ROUTES[data.role] ?? "/dashboard";
      router.push(defaultRoute);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const registerUser = async (email: string, password: string, fullName: string, roleName: string) => {
    setLoading(true);
    try {
      await api.post("/auth/register", {
        email,
        password,
        full_name: fullName,
        role_name: roleName,
      });
      setLoading(false);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const verifyOtpAndLogin = async (email: string, otpCode: string) => {
    setLoading(true);
    try {
      const data = await api.post<{ access_token: string; role: string; email: string }>("/auth/verify-otp", {
        email,
        otp_code: otpCode,
        purpose: "verify"
      });
      localStorage.setItem("transitops_token", data.access_token);
      setToken(data.access_token);

      const userProfile = await api.get<UserProfile>("/auth/me");
      setUser(userProfile);

      const perms = await fetchPermissions();
      setPermissions(perms);
      setLoading(false);

      const defaultRoute = ROLE_DEFAULT_ROUTES[data.role] ?? "/dashboard";
      router.push(defaultRoute);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("transitops_token");
    setToken(null);
    setUser(null);
    setPermissions({});
    router.push("/login");
  };

  const hasPermission = (module: string, minLevel: "view" | "full" = "view"): boolean => {
    const level = permissions[module] ?? "none";
    return LEVEL_SCORE[level] >= LEVEL_SCORE[minLevel];
  };

  return (
    <AuthContext.Provider value={{ user, token, permissions, loading, login, registerUser, verifyOtpAndLogin, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
