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

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  login: (form: FormData) => Promise<void>;
  registerUser: (email: string, password: string, fullName: string, roleName: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadStoredAuth() {
      const storedToken = localStorage.getItem("transitops_token");
      if (storedToken) {
        setToken(storedToken);
        try {
          const userProfile = await api.get<UserProfile>("/auth/me");
          setUser(userProfile);
        } catch (error) {
          console.error("Failed to load user profile", error);
          // Token expired or invalid
          localStorage.removeItem("transitops_token");
          setToken(null);
          setUser(null);
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
      setLoading(false);
      
      router.push("/dashboard");
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

      // Automatically log in the registered user
      const formData = new FormData();
      formData.append("username", email);
      formData.append("password", password);

      const data = await api.post<{ access_token: string; role: string; email: string }>("/auth/login", formData, true);
      localStorage.setItem("transitops_token", data.access_token);
      setToken(data.access_token);

      const userProfile = await api.get<UserProfile>("/auth/me");
      setUser(userProfile);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("transitops_token");
    setToken(null);
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, registerUser, logout }}>
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
