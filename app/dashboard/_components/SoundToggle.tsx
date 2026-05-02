"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useSounds } from "./SoundProvider";
import { playClick } from "@/lib/sounds";

export default function SoundToggle() {
  const { soundsEnabled, toggleSounds } = useSounds();

  function handleToggle() {
    toggleSounds();
    if (!soundsEnabled) {
      void playClick();
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      title={soundsEnabled ? "Mute sounds" : "Enable sounds"}
      aria-label={soundsEnabled ? "Mute sounds" : "Enable sounds"}
      aria-pressed={soundsEnabled}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 10px",
        borderRadius: 6,
        border: "1px solid rgba(255,255,255,0.06)",
        backgroundColor: soundsEnabled ? "rgba(255,82,0,0.06)" : "transparent",
        color: soundsEnabled ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.22)",
        fontSize: 11,
        fontFamily: "var(--font-outfit)",
        cursor: "pointer",
        width: "100%",
        transition: "all 0.15s ease",
      }}
    >
      {soundsEnabled
        ? <Volume2 size={12} strokeWidth={1.5} />
        : <VolumeX size={12} strokeWidth={1.5} />}
      <span>{soundsEnabled ? "Sound on" : "Sound off"}</span>
    </button>
  );
}
