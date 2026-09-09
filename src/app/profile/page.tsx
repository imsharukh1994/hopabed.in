"use client";

import { useAuthModal } from "@/components/AuthProvider";
import Image from "next/image";

export default function ProfilePage() {
  const { user } = useAuthModal();

  if (!user) {
    return <p className="px-6 py-10 text-center">Please log in.</p>;
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="rounded-2xl bg-white p-8 shadow-sm">
        <div className="flex items-center gap-6">
          <Image
            src={user.avatar || "/default-avatar.png"}
            alt={`${user.name}'s avatar`}
            width={80}
            height={80}
            className="rounded-full"
          />
          <div>
            <h1 className="text-2xl font-bold text-ink-soft">{user.name}</h1>
            <p className="text-muted">{user.email}</p>
          </div>
        </div>
        <div className="mt-6 space-y-2">
          <p>
            <span className="font-medium">Role:</span> {user.role}
          </p>
          <p>
            <span className="font-medium">Member since:</span>{" "}
            {new Date(user.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}