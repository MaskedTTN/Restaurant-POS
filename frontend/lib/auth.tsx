"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on mount
    const storedToken = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("auth_user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    } else if (storedUser && !storedToken) {
      // If a user was persisted without a token, clear it to avoid unauthenticated state
      localStorage.removeItem("auth_user");
      setUser(null);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        let error: any = {};
        try {
          error = await response.json();
        } catch (e) {
          error = { text: await response.text() };
        }
        console.error(
          "[auth] login error response:",
          error,
          "status",
          response.status,
        );
        throw new Error(error.message || error.text || "Login failed");
      }

      const data = await response.json();
      console.debug("[auth] login success response:", data);

      // Store token and user data
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("auth_user", JSON.stringify(data.user));

      try {
        console.debug(
          "[auth] stored auth_token after login:",
          localStorage.getItem("auth_token"),
        );
      } catch (e) {}

      setToken(data.token);
      setUser(data.user);
    } catch (error) {
      throw error;
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      if (!response.ok) {
        let error: any = {};
        try {
          error = await response.json();
        } catch (e) {
          error = { text: await response.text() };
        }
        console.error(
          "[auth] signup error response:",
          error,
          "status",
          response.status,
        );
        throw new Error(error.message || error.text || "Signup failed");
      }

      const data = await response.json();
      console.debug("[auth] signup success response:", data);

      // Store token and user data
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("auth_user", JSON.stringify(data.user));

      try {
        console.debug(
          "[auth] stored auth_token after signup:",
          localStorage.getItem("auth_token"),
        );
      } catch (e) {}

      setToken(data.token);
      setUser(data.user);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, signup, logout, isLoading }}
    >
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
