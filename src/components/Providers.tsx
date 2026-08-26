"use client";

import { AuthProvider } from "./AuthProvider";
import { AuthModal } from "./AuthModal";
import { WishlistProvider } from "./WishlistProvider";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <WishlistProvider>
        {children}
        <AuthModal />
      </WishlistProvider>
    </AuthProvider>
  );
}
