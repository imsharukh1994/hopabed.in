"use client";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { useAuthModal } from "@/components/AuthProvider";
import { useEffect } from "react";

export default function ProfilePage() {
  const { openAuth } = useAuthModal();

  useEffect(() => {
    openAuth();
  }, [openAuth]);

  return (
    <PlaceholderPage
      title="Profile"
      description="Guest profiles, verification status and booking history will live here after authentication is connected."
      actionHref="/"
      actionLabel="Back to home"
    />
  );
}
