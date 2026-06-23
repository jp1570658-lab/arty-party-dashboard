import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ActiveEvent {
  id: string;
  name: string;
}

interface UIState {
  darkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (v: boolean) => void;

  activeEvent: ActiveEvent | null;
  setActiveEvent: (e: ActiveEvent | null) => void;

  aiOpen: boolean;
  setAiOpen: (v: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      darkMode: false,
      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
      setDarkMode: (v) => set({ darkMode: v }),

      activeEvent: null,
      setActiveEvent: (e) => set({ activeEvent: e }),

      aiOpen: false,
      setAiOpen: (v) => set({ aiOpen: v }),
    }),
    { name: "arty-party-ui" }
  )
);
