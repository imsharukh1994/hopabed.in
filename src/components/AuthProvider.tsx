"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getCurrentUser } from "@/lib/api";

export type AuthUser = { id: string; name: string; email: string; role: string; phone?: string; avatarUrl?: string };

type AuthContextValue = {
  isOpen: boolean;
  isOwnerFlow: boolean;
  openAuth: (options?: { isOwnerFlow?: boolean }) => void;
  closeAuth: () => void;
  user: AuthUser | null;
  setSession: (token: string, user: AuthUser) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isOwnerFlow, setIsOwnerFlow] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("hopebed_access_token");
    if (!token) return;
    getCurrentUser(token).then(setUser).catch(() => {
      localStorage.removeItem("hopebed_access_token");
    });
  }, []);

  const value = useMemo(
    () => ({
      isOpen,
      isOwnerFlow,
      openAuth: (options?: { isOwnerFlow?: boolean }) => {
        const isOwner = Boolean(options && typeof options === "object" && "isOwnerFlow" in options && options.isOwnerFlow);
        setIsOwnerFlow(isOwner);
        setIsOpen(true);
      },
      closeAuth: () => {
        setIsOpen(false);
        setIsOwnerFlow(false);
      },
      user,
      setSession: (token: string, authenticatedUser: AuthUser) => {
        localStorage.setItem("hopebed_access_token", token);
        setUser(authenticatedUser);
      },
      logout: () => {
        localStorage.removeItem("hopebed_access_token");
        setUser(null);
      },
    }),
    [isOpen, isOwnerFlow, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthModal() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthModal must be used within AuthProvider");
  }
  return context;
}
