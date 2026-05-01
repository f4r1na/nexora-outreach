"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitBranch,
  Star,
  Search,
  Plus,
  X,
  RefreshCw,
  Check as CheckIcon,
  Loader2,
  ExternalLink,
  ChevronDown,
  GitCommitHorizontal,
} from "lucide-react";
import SectionHeader from "@/app/dashboard/settings/_components/SectionHeader";
import SaveStatus from "@/app/dashboard/settings/_components/SaveStatus";
import FormCheckbox from "@/app/dashboard/settings/_components/FormCheckbox";
import FormSelect from "@/app/dashboard/settings/_components/FormSelect";

const EASE = [0.23, 1, 0.32, 1] as const;

function fadeUp(i: number) {
  return {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: i * 0.07, duration: 0.26, ease: EASE },
  };
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      style={{
        position: "relative",
        width: 38,
        height: 22,
        borderRadius: 11,
        backgroundColor: checked ? "#FF5200" : "rgba(255,255,255,0.12)",
        border: "none",
        cursor: "pointer",
        padding: 0,
        flexShrink: 0,
        transition: "background-color 0.2s ease",
        outline: "none",
      }}
    >
      <motion.div
        animate={{ x: checked ? 18 : 3 }}
        transition={{ type: "spring", stiffness: 420, damping: 32 }}
        style={{
          position: "absolute",
          top: 3,
          left: 0,
          width: 16,
          height: 16,
          borderRadius: "50%",
          backgroundColor: "#fff",
          boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
        }}
      />
    </button>
  );
}

// ─── LanguageSelect ───────────────────────────────────────────────────────────

const LANGUAGES = [
  { value: "js_ts",  label: "JavaScript/TypeScript" },
  { value: "python", label: "Python" },
  { value: "go",     label: "Go" },
  { value: "rust",   label: "Rust" },
  { value: "java",   label: "Java" },
  { value: "csharp", label: "C#" },
  { value: "ruby",   label: "Ruby" },
  { value: "php",    label: "PHP" },
];

function LanguageSelect({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function toggle(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  }

  const displayLabel =
    selected.length === 0
      ? "Select languages..."
      : selected.length === 1
      ? LANGUAGES.find((l) => l.value === selected[0])?.label ?? ""
      : `${selected.length} languages selected`;

  return (
    <div
      ref={ref}
      style={{
        backgroundColor: "rgba(255,255,255,0.05)",
        borderRadius: 8,
        padding: 16,
      }}
    >
      <p
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: "rgba(255,255,255,0.7)",
          fontFamily: "var(--font-outfit)",
          margin: "0 0 8px",
        }}
      >
        Monitor these languages:
      </p>
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setOpen((o) => !o)}
          style={{
            width: "100%",
            padding: "8px 12px",
            borderRadius: 6,
            backgroundColor: "#060606",
            border: `1px solid ${open ? "#FF5200" : "rgba(255,255,255,0.1)"}`,
            color: selected.length > 0 ? "#fff" : "rgba(255,255,255,0.35)",
            fontSize: 13,
            fontFamily: "var(--font-outfit)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            transition: "border-color 0.15s ease",
            textAlign: "left",
          }}
        >
          <span>{displayLabel}</span>
          <ChevronDown
            size={14}
            color="rgba(255,255,255,0.4)"
            style={{
              flexShrink: 0,
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          />
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -6, scaleY: 0.92 }}
              animate={{ opacity: 1, y: 0, scaleY: 1 }}
              exit={{ opacity: 0, y: -4, scaleY: 0.94 }}
              transition={{ duration: 0.16, ease: EASE }}
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                left: 0,
                right: 0,
                backgroundColor: "#111",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                padding: 6,
                zIndex: 50,
                transformOrigin: "top",
                boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
              }}
            >
              {LANGUAGES.map((lang) => {
                const isChecked = selected.includes(lang.value);
                return (
                  <label
                    key={lang.value}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "7px 10px",
                      cursor: "pointer",
                      borderRadius: 5,
                      backgroundColor: isChecked
                        ? "rgba(255,82,0,0.06)"
                        : "transparent",
                      transition: "background-color 0.12s ease",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggle(lang.value)}
                      style={{
                        accentColor: "#FF5200",
                        width: 14,
                        height: 14,
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 13,
                        color: isChecked
                          ? "rgba(255,255,255,0.9)"
                          : "rgba(255,255,255,0.65)",
                        fontFamily: "var(--font-outfit)",
                      }}
                    >
                      {lang.label}
                    </span>
                  </label>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── AddRepoModal ─────────────────────────────────────────────────────────────

function AddRepoModal({
  onAdd,
  onClose,
}: {
  onAdd: (name: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Enter a repository name");
      return;
    }
    if (!trimmed.includes("/")) {
      setError("Use format: owner/repository");
      return;
    }
    onAdd(trimmed);
    onClose();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.65)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 8 }}
        transition={{ duration: 0.18, ease: EASE }}
        style={{
          backgroundColor: "#0e0e14",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 12,
          padding: 28,
          width: "100%",
          maxWidth: 440,
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <h3
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "#fff",
              fontFamily: "var(--font-syne)",
              margin: 0,
              letterSpacing: "-0.01em",
            }}
          >
            Add Repository
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
              borderRadius: 4,
              color: "rgba(255,255,255,0.4)",
              display: "flex",
            }}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              color: "rgba(255,255,255,0.5)",
              fontFamily: "var(--font-outfit)",
              marginBottom: 6,
            }}
          >
            Repository (owner/name)
          </label>
          <input
            type="text"
            autoFocus
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError("");
            }}
            placeholder="e.g. vercel/next.js"
            style={{
              width: "100%",
              padding: "9px 12px",
              borderRadius: 7,
              backgroundColor: "#060606",
              border: `1px solid ${error ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`,
              color: "#fff",
              fontSize: 13,
              fontFamily: "var(--font-outfit)",
              outline: "none",
              boxSizing: "border-box",
              marginBottom: error ? 6 : 20,
            }}
          />
          {error && (
            <p
              style={{
                fontSize: 11.5,
                color: "#ef4444",
                fontFamily: "var(--font-outfit)",
                margin: "0 0 14px",
              }}
            >
              {error}
            </p>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 18px",
                borderRadius: 7,
                backgroundColor: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.6)",
                fontSize: 13,
                fontFamily: "var(--font-outfit)",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: "8px 18px",
                borderRadius: 7,
                backgroundColor: "#FF5200",
                border: "none",
                color: "#fff",
                fontSize: 13,
                fontWeight: 500,
                fontFamily: "var(--font-outfit)",
                cursor: "pointer",
              }}
            >
              Add Repository
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const REPO_TYPE_OPTIONS = [
  { value: "all",      label: "All repos" },
  { value: "public",   label: "Public repos only" },
  { value: "specific", label: "Specific repos only" },
];

const REPO_SIZE_OPTIONS = [
  { value: "any",   label: "Any size" },
  { value: "10",    label: "10+ stars" },
  { value: "100",   label: "100+ stars" },
  { value: "1000",  label: "1000+ stars" },
];

const CONFIDENCE_OPTIONS = [
  { value: "high",   label: "HIGH (>90%)" },
  { value: "medium", label: "MEDIUM (>70%)" },
  { value: "all",    label: "ALL" },
];

const DECAY_OPTIONS = [
  { value: "7",  label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "60", label: "60 days" },
  { value: "90", label: "90 days" },
];

const DEFAULT_REPOS = [
  { name: "humberto-garza/nexora-outreach", stars: "42",   lastChecked: "2h ago" },
  { name: "vercel/next.js",                 stars: "112k", lastChecked: "1h ago" },
  { name: "openai/gpt-4",                   stars: "58k",  lastChecked: "30m ago" },
];

const RECENT_DETECTIONS = [
  { date: "Apr 30, 2:15 PM",  repo: "nexora-outreach", change: "React 18.2.0",    confidence: "HIGH" },
  { date: "Apr 29, 11:42 AM", repo: "gpt-4",           change: "TypeScript 5.0",  confidence: "HIGH" },
];

interface Settings {
  connected:            boolean;
  gh_username:          string;
  monitor_dep_upgrades: boolean;
  monitor_new_deps:     boolean;
  monitor_major:        boolean;
  monitor_security:     boolean;
  monitor_dev_tools:    boolean;
  repo_type:            string;
  repo_languages:       string[];
  repo_size:            string;
  confidence_threshold: string;
  signal_decay:         string;
}

const DEFAULTS: Settings = {
  connected:            false,
  gh_username:          "",
  monitor_dep_upgrades: true,
  monitor_new_deps:     true,
  monitor_major:        true,
  monitor_security:     true,
  monitor_dev_tools:    true,
  repo_type:            "public",
  repo_languages:       ["js_ts"],
  repo_size:            "any",
  confidence_threshold: "high",
  signal_decay:         "30",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GitHubDetectionPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [repos, setRepos] = useState(DEFAULT_REPOS);
  const [repoSearch, setRepoSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | undefined>();
  const [saveTimestamp, setSaveTimestamp] = useState<Date | undefined>();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata) {
        const m = user.user_metadata;
        setSettings({
          connected:            m.gh_connected            ?? DEFAULTS.connected,
          gh_username:          m.gh_username             ?? DEFAULTS.gh_username,
          monitor_dep_upgrades: m.gh_monitor_dep_upgrades ?? DEFAULTS.monitor_dep_upgrades,
          monitor_new_deps:     m.gh_monitor_new_deps     ?? DEFAULTS.monitor_new_deps,
          monitor_major:        m.gh_monitor_major        ?? DEFAULTS.monitor_major,
          monitor_security:     m.gh_monitor_security     ?? DEFAULTS.monitor_security,
          monitor_dev_tools:    m.gh_monitor_dev_tools    ?? DEFAULTS.monitor_dev_tools,
          repo_type:            m.gh_repo_type            ?? DEFAULTS.repo_type,
          repo_languages:       m.gh_repo_languages       ?? DEFAULTS.repo_languages,
          repo_size:            m.gh_repo_size            ?? DEFAULTS.repo_size,
          confidence_threshold: m.gh_confidence_threshold ?? DEFAULTS.confidence_threshold,
          signal_decay:         m.gh_signal_decay         ?? DEFAULTS.signal_decay,
        });
      }
    }).finally(() => setLoading(false));
  }, []);

  const save = useCallback(async (patch: Record<string, unknown>) => {
    setSaveStatus("saving");
    setSaveError(undefined);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ data: patch });
      if (error) {
        setSaveError(error.message);
        setSaveStatus("error");
      } else {
        setSaveTimestamp(new Date());
        setSaveStatus("saved");
      }
    } catch {
      setSaveError("Failed to save");
      setSaveStatus("error");
    }
  }, []);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((s) => ({ ...s, [key]: value }));
  }

  function autoSaveBoolean(key: keyof Settings, value: boolean) {
    update(key, value as Settings[typeof key]);
    save({ [`gh_${key}`]: value });
  }

  function autoSaveString(key: keyof Settings, value: string) {
    update(key, value as Settings[typeof key]);
    save({ [`gh_${key}`]: value });
  }

  function handleLanguagesChange(langs: string[]) {
    update("repo_languages", langs);
    save({ gh_repo_languages: langs });
  }

  function handleConnect() {
    // In production: redirect to GitHub OAuth
    const username = "nexora-user";
    update("connected", true);
    update("gh_username", username);
    save({ gh_connected: true, gh_username: username });
  }

  function handleDisconnect() {
    update("connected", false);
    update("gh_username", "");
    save({ gh_connected: false, gh_username: "" });
  }

  async function handleSyncNow() {
    setSyncing(true);
    await new Promise((r) => setTimeout(r, 1800));
    setSyncing(false);
  }

  function handleAddRepo(name: string) {
    setRepos((prev) => [
      { name, stars: "0", lastChecked: "just now" },
      ...prev,
    ]);
  }

  function handleRemoveRepo(name: string) {
    setRepos((prev) => prev.filter((r) => r.name !== name));
  }

  async function handleSaveAll() {
    const patch: Record<string, unknown> = {};
    (Object.keys(settings) as (keyof Settings)[]).forEach((k) => {
      patch[`gh_${k}`] = settings[k];
    });
    await save(patch);
  }

  const filteredRepos = repos.filter((r) =>
    r.name.toLowerCase().includes(repoSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}>
        <Loader2
          size={20}
          color="rgba(255,255,255,0.25)"
          style={{ animation: "spin 0.8s linear infinite" }}
        />
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
        style={{ maxWidth: 900, paddingBottom: 80 }}
      >
        {/* ── Page header ── */}
        <motion.div {...fadeUp(0)} style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 18 }}>
            {/* GitHub icon block */}
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <GitBranch size={24} color="rgba(255,255,255,0.7)" />
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
                <h1
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: "#fff",
                    fontFamily: "var(--font-syne)",
                    letterSpacing: "-0.02em",
                    margin: 0,
                    lineHeight: 1.2,
                  }}
                >
                  GitHub Signal Detection
                </h1>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    color: "#4ade80",
                    backgroundColor: "rgba(74,222,128,0.1)",
                    border: "1px solid rgba(74,222,128,0.25)",
                    borderRadius: 4,
                    padding: "2px 7px",
                    fontFamily: "var(--font-outfit)",
                    lineHeight: 1,
                    alignSelf: "center",
                  }}
                >
                  ACTIVE
                </span>
              </div>
              <p
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.45)",
                  fontFamily: "var(--font-outfit)",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                Monitor target companies&apos; public repositories for tech stack changes
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── SECTION 1: GitHub Integration ── */}
        <motion.section {...fadeUp(1)} style={{ marginBottom: 48 }}>
          <SectionHeader title="GitHub Integration" divider />

          <motion.div {...fadeUp(2)}>
            <div
              style={{
                backgroundColor: "rgba(255,255,255,0.05)",
                borderRadius: 8,
                padding: 20,
              }}
            >
              {settings.connected ? (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                  }}
                >
                  {/* Connection info */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        backgroundColor: "rgba(74,222,128,0.15)",
                        border: "1px solid rgba(74,222,128,0.3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <CheckIcon size={14} color="#4ade80" strokeWidth={2.5} />
                    </div>
                    <div>
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: "#fff",
                          fontFamily: "var(--font-outfit)",
                          margin: 0,
                        }}
                      >
                        Connected as{" "}
                        <span style={{ color: "#FF5200" }}>
                          @{settings.gh_username}
                        </span>
                      </p>
                      <p
                        style={{
                          fontSize: 11.5,
                          color: "rgba(255,255,255,0.35)",
                          fontFamily: "var(--font-outfit)",
                          margin: "2px 0 0",
                        }}
                      >
                        Last sync: 2 hours ago
                      </p>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      onClick={handleSyncNow}
                      disabled={syncing}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "7px 14px",
                        borderRadius: 7,
                        backgroundColor: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "rgba(255,255,255,0.7)",
                        fontSize: 12,
                        fontFamily: "var(--font-outfit)",
                        cursor: syncing ? "not-allowed" : "pointer",
                        opacity: syncing ? 0.6 : 1,
                        transition: "opacity 0.15s ease",
                      }}
                    >
                      <RefreshCw
                        size={13}
                        style={{
                          animation: syncing ? "spin 0.8s linear infinite" : "none",
                        }}
                      />
                      {syncing ? "Syncing..." : "Sync Now"}
                    </button>
                    <button
                      onClick={handleDisconnect}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "7px 14px",
                        borderRadius: 7,
                        backgroundColor: "rgba(239,68,68,0.08)",
                        border: "1px solid rgba(239,68,68,0.2)",
                        color: "#ef4444",
                        fontSize: 12,
                        fontFamily: "var(--font-outfit)",
                        cursor: "pointer",
                      }}
                    >
                      <X size={13} />
                      Disconnect
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      backgroundColor: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <GitBranch size={14} color="rgba(255,255,255,0.4)" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        fontSize: 13,
                        color: "rgba(255,255,255,0.5)",
                        fontFamily: "var(--font-outfit)",
                        margin: 0,
                      }}
                    >
                      Not connected
                    </p>
                    <p
                      style={{
                        fontSize: 11.5,
                        color: "rgba(255,255,255,0.25)",
                        fontFamily: "var(--font-outfit)",
                        margin: "2px 0 0",
                      }}
                    >
                      Connect your GitHub account to start monitoring repositories
                    </p>
                  </div>
                  <button
                    onClick={handleConnect}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 7,
                      padding: "8px 16px",
                      borderRadius: 7,
                      backgroundColor: "#FF5200",
                      border: "none",
                      color: "#fff",
                      fontSize: 13,
                      fontWeight: 500,
                      fontFamily: "var(--font-outfit)",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    <GitBranch size={14} />
                    Connect GitHub
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.section>

        {/* ── SECTION 2: What to Monitor ── */}
        <motion.section {...fadeUp(3)} style={{ marginBottom: 48 }}>
          <SectionHeader
            title="What to Monitor"
            description="Choose which changes trigger alerts"
            divider
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <motion.div {...fadeUp(4)}>
              <FormCheckbox
                label="Dependency Upgrades"
                description="React 17→18, Node 14→16, etc."
                checked={settings.monitor_dep_upgrades}
                onChange={(v) => autoSaveBoolean("monitor_dep_upgrades", v)}
              />
            </motion.div>
            <motion.div {...fadeUp(5)}>
              <FormCheckbox
                label="New Dependencies"
                description="npm packages added to projects"
                checked={settings.monitor_new_deps}
                onChange={(v) => autoSaveBoolean("monitor_new_deps", v)}
              />
            </motion.div>
            <motion.div {...fadeUp(6)}>
              <FormCheckbox
                label="Major Version Changes"
                description="Breaking changes in versions"
                checked={settings.monitor_major}
                onChange={(v) => autoSaveBoolean("monitor_major", v)}
              />
            </motion.div>
            <motion.div {...fadeUp(7)}>
              <FormCheckbox
                label="Security Patches"
                description="Security-related updates"
                checked={settings.monitor_security}
                onChange={(v) => autoSaveBoolean("monitor_security", v)}
              />
            </motion.div>
            <motion.div {...fadeUp(8)}>
              <FormCheckbox
                label="Development Tools"
                description="Changes to build tools, CI/CD, testing frameworks"
                checked={settings.monitor_dev_tools}
                onChange={(v) => autoSaveBoolean("monitor_dev_tools", v)}
              />
            </motion.div>
          </div>
        </motion.section>

        {/* ── SECTION 3: Repository Filters ── */}
        <motion.section {...fadeUp(9)} style={{ marginBottom: 48 }}>
          <SectionHeader
            title="Repository Selection"
            description="Which repositories to monitor"
            divider
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <motion.div {...fadeUp(10)}>
              <FormSelect
                label="Monitor only:"
                options={REPO_TYPE_OPTIONS}
                value={settings.repo_type}
                onChange={(v) => autoSaveString("repo_type", v)}
              />
            </motion.div>
            <motion.div {...fadeUp(11)}>
              <LanguageSelect
                selected={settings.repo_languages}
                onChange={handleLanguagesChange}
              />
            </motion.div>
            <motion.div {...fadeUp(12)}>
              <FormSelect
                label="Minimum repo size:"
                options={REPO_SIZE_OPTIONS}
                value={settings.repo_size}
                onChange={(v) => autoSaveString("repo_size", v)}
              />
            </motion.div>
          </div>
        </motion.section>

        {/* ── SECTION 4: Tracked Repositories ── */}
        <motion.section {...fadeUp(13)} style={{ marginBottom: 48 }}>
          <SectionHeader
            title="Tracked Repositories"
            description="Repositories being monitored for this target"
            divider
          />

          {/* Search + Add */}
          <motion.div
            {...fadeUp(14)}
            style={{
              display: "flex",
              gap: 10,
              marginBottom: 12,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                flex: 1,
                minWidth: 200,
                position: "relative",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Search
                size={14}
                color="rgba(255,255,255,0.25)"
                style={{ position: "absolute", left: 12, pointerEvents: "none" }}
              />
              <input
                type="text"
                placeholder="Search repositories..."
                value={repoSearch}
                onChange={(e) => setRepoSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px 8px 36px",
                  borderRadius: 7,
                  backgroundColor: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#fff",
                  fontSize: 13,
                  fontFamily: "var(--font-outfit)",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s ease",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,82,0,0.5)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                }}
              />
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 7,
                backgroundColor: "#FF5200",
                border: "none",
                color: "#fff",
                fontSize: 13,
                fontWeight: 500,
                fontFamily: "var(--font-outfit)",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <Plus size={14} />
              Add Repository
            </button>
          </motion.div>

          {/* Repo list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <AnimatePresence mode="popLayout">
              {filteredRepos.length === 0 ? (
                <motion.p
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    fontSize: 13,
                    color: "rgba(255,255,255,0.25)",
                    fontFamily: "var(--font-outfit)",
                    padding: "20px 0",
                    textAlign: "center",
                  }}
                >
                  {repoSearch ? "No repositories match your search" : "No repositories tracked yet"}
                </motion.p>
              ) : (
                filteredRepos.map((repo, i) => (
                  <motion.div
                    key={repo.name}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -12, transition: { duration: 0.15 } }}
                    transition={{ delay: i * 0.04, duration: 0.22, ease: EASE }}
                    style={{
                      backgroundColor: "rgba(255,255,255,0.05)",
                      borderRadius: 8,
                      padding: "13px 16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                      <GitBranch
                        size={15}
                        color="rgba(255,255,255,0.3)"
                        style={{ flexShrink: 0 }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: 13,
                            color: "rgba(255,255,255,0.85)",
                            fontFamily: "var(--font-outfit)",
                            margin: 0,
                            fontWeight: 500,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {repo.name}
                        </p>
                        <p
                          style={{
                            fontSize: 11.5,
                            color: "rgba(255,255,255,0.3)",
                            fontFamily: "var(--font-outfit)",
                            margin: "2px 0 0",
                          }}
                        >
                          Last checked: {repo.lastChecked}
                        </p>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Star
                          size={12}
                          color="rgba(251,191,36,0.7)"
                          fill="rgba(251,191,36,0.7)"
                        />
                        <span
                          style={{
                            fontSize: 12,
                            color: "rgba(255,255,255,0.4)",
                            fontFamily: "var(--font-outfit)",
                          }}
                        >
                          {repo.stars}
                        </span>
                      </div>

                      <button
                        onClick={() => handleRemoveRepo(repo.name)}
                        title="Remove repository"
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 5,
                          backgroundColor: "transparent",
                          border: "1px solid rgba(255,255,255,0.08)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "rgba(255,255,255,0.3)",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          const b = e.currentTarget;
                          b.style.backgroundColor = "rgba(239,68,68,0.1)";
                          b.style.borderColor = "rgba(239,68,68,0.3)";
                          b.style.color = "#ef4444";
                        }}
                        onMouseLeave={(e) => {
                          const b = e.currentTarget;
                          b.style.backgroundColor = "transparent";
                          b.style.borderColor = "rgba(255,255,255,0.08)";
                          b.style.color = "rgba(255,255,255,0.3)";
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </motion.section>

        {/* ── SECTION 5: Signal Confidence ── */}
        <motion.section {...fadeUp(15)} style={{ marginBottom: 48 }}>
          <SectionHeader title="Signal Confidence Settings" divider />
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <motion.div {...fadeUp(16)}>
              <FormSelect
                label="Only alert on signals with confidence:"
                options={CONFIDENCE_OPTIONS}
                value={settings.confidence_threshold}
                onChange={(v) => autoSaveString("confidence_threshold", v)}
              />
            </motion.div>
            <motion.div {...fadeUp(17)}>
              <FormSelect
                label="Show signals detected in last:"
                options={DECAY_OPTIONS}
                value={settings.signal_decay}
                onChange={(v) => autoSaveString("signal_decay", v)}
              />
            </motion.div>
          </div>
        </motion.section>

        {/* ── SECTION 6: Recent Detections ── */}
        <motion.section {...fadeUp(18)} style={{ marginBottom: 48 }}>
          <SectionHeader
            title="Recent Tech Stack Changes"
            divider
          />
          <div style={{ overflowX: "auto", borderRadius: 8 }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 500,
                fontFamily: "var(--font-outfit)",
              }}
            >
              <thead>
                <tr>
                  {["Date", "Repository", "Change", "Confidence", "Commit"].map((col) => (
                    <th
                      key={col}
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "rgba(255,255,255,0.35)",
                        textAlign: "left",
                        padding: "10px 16px",
                        backgroundColor: "rgba(255,255,255,0.03)",
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RECENT_DETECTIONS.map((row, i) => (
                  <motion.tr
                    key={i}
                    {...fadeUp(19 + i)}
                    style={{
                      borderBottom:
                        i < RECENT_DETECTIONS.length - 1
                          ? "1px solid rgba(255,255,255,0.05)"
                          : "none",
                    }}
                  >
                    <td
                      style={{
                        fontSize: 12,
                        color: "rgba(255,255,255,0.45)",
                        padding: "14px 16px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {row.date}
                    </td>
                    <td
                      style={{
                        fontSize: 12,
                        color: "rgba(255,255,255,0.7)",
                        padding: "14px 16px",
                        fontFamily: "'Courier New', Courier, monospace",
                      }}
                    >
                      {row.repo}
                    </td>
                    <td
                      style={{
                        fontSize: 13,
                        color: "rgba(255,255,255,0.85)",
                        padding: "14px 16px",
                        fontWeight: 500,
                      }}
                    >
                      {row.change}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          letterSpacing: "0.07em",
                          padding: "3px 8px",
                          borderRadius: 4,
                          color: row.confidence === "HIGH" ? "#4ade80" : "#fbbf24",
                          backgroundColor:
                            row.confidence === "HIGH"
                              ? "rgba(74,222,128,0.1)"
                              : "rgba(251,191,36,0.1)",
                          border: `1px solid ${
                            row.confidence === "HIGH"
                              ? "rgba(74,222,128,0.2)"
                              : "rgba(251,191,36,0.2)"
                          }`,
                        }}
                      >
                        {row.confidence}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <button
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          fontSize: 12,
                          color: "rgba(255,255,255,0.5)",
                          backgroundColor: "transparent",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 5,
                          padding: "4px 10px",
                          cursor: "pointer",
                          fontFamily: "var(--font-outfit)",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          const b = e.currentTarget;
                          b.style.color = "#fff";
                          b.style.borderColor = "rgba(255,255,255,0.25)";
                        }}
                        onMouseLeave={(e) => {
                          const b = e.currentTarget;
                          b.style.color = "rgba(255,255,255,0.5)";
                          b.style.borderColor = "rgba(255,255,255,0.1)";
                        }}
                      >
                        <GitCommitHorizontal size={12} />
                        View
                        <ExternalLink size={10} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>

        {/* ── Footer ── */}
        <motion.div
          {...fadeUp(21)}
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <button
            onClick={handleSaveAll}
            disabled={saveStatus === "saving"}
            style={{
              padding: "9px 22px",
              borderRadius: 7,
              backgroundColor:
                saveStatus === "saving" ? "rgba(255,82,0,0.5)" : "#FF5200",
              color: "#fff",
              fontSize: 13,
              fontWeight: 500,
              fontFamily: "var(--font-outfit)",
              border: "none",
              cursor: saveStatus === "saving" ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              transition: "filter 0.15s ease, background-color 0.15s ease",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              if (saveStatus !== "saving")
                (e.currentTarget as HTMLButtonElement).style.filter =
                  "brightness(1.1)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.filter = "none";
            }}
          >
            {saveStatus === "saving" ? (
              <>
                <Loader2
                  size={13}
                  strokeWidth={2}
                  style={{ animation: "spin 0.8s linear infinite" }}
                />
                Saving...
              </>
            ) : (
              "Save Settings"
            )}
          </button>

          <SaveStatus
            status={saveStatus}
            message={saveError}
            timestamp={saveTimestamp}
          />

          <span
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.2)",
              fontFamily: "var(--font-outfit)",
              marginLeft: "auto",
            }}
          >
            Last synced 15 minutes ago
          </span>
        </motion.div>
      </motion.div>

      {/* ── Add Repo Modal ── */}
      <AnimatePresence>
        {showAddModal && (
          <AddRepoModal
            onAdd={handleAddRepo}
            onClose={() => setShowAddModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
