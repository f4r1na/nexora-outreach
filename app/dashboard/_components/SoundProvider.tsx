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
  const [soundsEnabled, setSoundsState] = useState(true);

  useEffect(() => {
    setSoundsState(getSoundsEnabled());
  }, []);

  function toggleSounds() {
    const next = !soundsEnabled;
    setSoundsState(next);
    setSoundsEnabled(next);
  }

  return (
    <SoundContext.Provider value={{ soundsEnabled, toggleSounds }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSounds() {
  return useContext(SoundContext);
}
