"use client";

import type { LucideIcon } from "lucide-react";

type SearchFieldProps = {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
  className?: string;
};

export function SearchField({ icon: Icon, label, children, className = "" }: SearchFieldProps) {
  return (
    <label className={`flex min-w-0 flex-1 items-center gap-3 px-4 py-3 ${className}`}>
      <Icon className="h-5 w-5 shrink-0 text-brand" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block text-[12px] font-semibold text-[#111111]">{label}</span>
        {children}
      </span>
    </label>
  );
}
