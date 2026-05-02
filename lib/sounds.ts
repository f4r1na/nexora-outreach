// Sound enabled state — stored in localStorage, defaults to true
let _enabled: boolean | null = null;

function isEnabled(): boolean {
  if (_enabled !== null) return _enabled;
  if (typeof window === "undefined") return false;
  const stored = localStorage.getItem("nx-sounds");
  _enabled = stored !== "false";
  return _enabled;
}

export function setSoundsEnabled(val: boolean): void {
  _enabled = val;
  if (typeof window !== "undefined") {
    localStorage.setItem("nx-sounds", val ? "true" : "false");
  }
}

export function getSoundsEnabled(): boolean {
  return isEnabled();
}

// Lazy Tone loader
let tonePromise: Promise<typeof import("tone")> | null = null;
async function getTone() {
  if (!tonePromise) tonePromise = import("tone");
  return tonePromise;
}

// Generic play helper — synth note sequence
async function playNotes(
  notes: string[],
  durations: string[],
  volume = -18,
  release = 0.4,
  attack = 0.001
): Promise<void> {
  if (!isEnabled()) return;
  if (typeof window === "undefined") return;
  try {
    const Tone = await getTone();
    await Tone.start();
    const synth = new Tone.Synth({
      oscillator: { type: "triangle" },
      envelope: { attack, decay: 0.1, sustain: 0.3, release },
      volume,
    }).toDestination();
    const now = Tone.now();
    let offset = 0;
    notes.forEach((note, i) => {
      const dur = durations[i] ?? "8n";
      const durSecs = Tone.Time(dur).toSeconds();
      synth.triggerAttackRelease(note, dur, now + offset);
      offset += durSecs * 0.8;
    });
    setTimeout(() => synth.dispose(), (offset + release + 0.5) * 1000);
  } catch {
    // AudioContext blocked or unavailable — fail silently
  }
}

/** Click: C major chord arpeggio (C4, E4, G4) — satisfied feeling */
export async function playClick(): Promise<void> {
  return playNotes(["C4", "E4", "G4"], ["16n", "16n", "8n"], -20, 0.3);
}

/** Send: D4 → G4 ascending — launching sensation */
export async function playSend(): Promise<void> {
  return playNotes(["D4", "G4"], ["8n", "4n"], -18, 0.5);
}

/** Success: C4 → F4 → C5 — celebratory resolution */
export async function playSuccess(): Promise<void> {
  return playNotes(["C4", "F4", "C5"], ["8n", "8n", "4n"], -16, 0.6);
}

/** Error: F#3 low thud — alerting without jarring */
export async function playError(): Promise<void> {
  return playNotes(["F#3"], ["8n"], -22, 0.2, 0.005);
}

/** Notify: E4 → B4 — welcoming, informative */
export async function playNotify(): Promise<void> {
  return playNotes(["E4", "B4"], ["16n", "8n"], -20, 0.4);
}
