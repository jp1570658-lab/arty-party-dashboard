"use client";

import { useEffect } from "react";
import { Toaster } from "sonner";
import { useUIStore } from "@/store/ui";

export function Providers({ children }: { children: React.ReactNode }) {
  const darkMode = useUIStore((s) => s.darkMode);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [darkMode]);

  return (
    <>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "var(--surface-0)",
            color: "var(--text-primary)",
            border: "1px solid var(--border)",
          },
        }}
      />
    </>
  );
}
