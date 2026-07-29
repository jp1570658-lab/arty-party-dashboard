"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";
import { AIAssistant } from "@/components/ai/AIAssistant";

/** Routes shown to people outside the team — no sidebar, header or AI panel. */
const BARE_ROUTES = ["/call-sheet"];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (BARE_ROUTES.some((r) => pathname?.startsWith(r))) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="md:pl-60">
        <Header />
        <main className="mx-auto w-full max-w-[1200px] px-4 pb-24 pt-6 md:px-8 md:pb-10">
          {children}
        </main>
      </div>
      <MobileNav />
      <AIAssistant />
    </div>
  );
}
