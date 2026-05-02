"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getSoundsEnabled, setSoundsEnabled } from "@/lib/sounds";

interface SoundContextType {
  soundsEnabled: boolean;
  toggleSounds: () => void;
}

const SoundContext = createContext<SoundContextType>({
  soundsEnabled: true,
  toggleSounds: () => {},
});

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [soundsEnabled, setSoundsState] = useState<boolean | null>(null);

  useEffect(() => {
    setSoundsState(getSoundsEnabled());
  }, []);

  function toggleSounds() {
    const next = !(soundsEnabled ?? true);
    setSoundsState(next);
    setSoundsEnabled(next);
  }

  // Provide `true` as fallback while not yet hydrated — avoids null propagation
  return (
    <SoundContext.Provider value={{ soundsEnabled: soundsEnabled ?? true, toggleSounds }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSounds() {
  return useContext(SoundContext);
}
