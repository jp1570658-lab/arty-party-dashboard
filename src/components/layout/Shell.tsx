"use client";

import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";
import { AIAssistant } from "@/components/ai/AIAssistant";

export function Shell({ children }: { children: React.ReactNode }) {
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
