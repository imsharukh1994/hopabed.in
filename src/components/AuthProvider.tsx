"use client";

import { createContext, useContext, useMemo, useState } from "react";

type AuthContextValue = {
  isOpen: boolean;
  openAuth: () => void;
  closeAuth: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const value = useMemo(
    () => ({
      isOpen,
      openAuth: () => setIsOpen(true),
      closeAuth: () => setIsOpen(false),
    }),
    [isOpen],
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
