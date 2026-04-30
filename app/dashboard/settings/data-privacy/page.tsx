"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Loader2, ShieldCheck, X, AlertTriangle } from "lucide-react";
import SectionHeader from "../_components/SectionHeader";
import SaveStatus from "../_components/SaveStatus";
import FormSelect from "../_components/FormSelect";

const EASE = [0.23, 1, 0.32, 1] as const;

function fadeUp(i: number) {
  return {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: i * 0.07, duration: 0.27, ease: EASE },
  };
}

const RETENTION_OPTIONS = [
  { value: "90days",  label: "90 days" },
  { value: "6months", label: "6 months" },
  { value: "1year",   label: "1 year" },
  { value: "forever", label: "Forever" },
];

const COMPLIANCE = [
  {
    title: "CAN-SPAM Compliant",
    status: "Verified",
    details: "All emails include unsubscribe links and sender address",
  },
  {
    title: "GDPR Compliant",
    status: "Verified",
    details: "User consent tracked, right to deletion enabled",
  },
  {
    title: "CASL Compliant",
    status: "Verified",
    details: "Canadian recipients require explicit consent",
  },
] as const;

function get30DayDate() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function DeleteModal({
  onClose,
  onConfirm,
  deleting,
  error,
}: {
  onClose: () => void;
  onConfirm: () => void;
  deleting: boolean;
  error: string | null;
}) {
  const [checked, setChecked] = useState(false);
  const deletionDate = get30DayDate();

  return (
    <motion.div
      key="backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        backgroundColor: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}
    >
      <motion.div
        key="modal"
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.22, ease: EASE }}
        style={{
          backgroundColor: "#0a0a14",
          border: "1px solid rgba(239,68,68,0.2)",
          borderRadius: 12, padding: 28,
          width: "100%", maxWidth: 400,
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 14, right: 14,
            background: "none", border: "none", cursor: "pointer",
            color: "rgba(255,255,255,0.35)", display: "flex",
          }}
          aria-label="Close"
        >
          <X size={16} strokeWidth={1.75} aria-hidden="true" />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <AlertTriangle size={17} strokeWidth={1.75} color="#ef4444" aria-hidden="true" />
          <h2 style={{
            fontSize: 15, fontWeight: 600, color: "#fff",
            fontFamily: "var(--font-syne)", margin: 0,
          }}>
            Delete Account Permanently?
          </h2>
        </div>

        <p style={{
          fontSize: 12, color: "rgba(255,255,255,0.5)",
          fontFamily: "var(--font-outfit)", lineHeight: 1.65, marginBottom: 20,
        }}>
          This action cannot be undone. All your campaigns, leads, emails, and billing data will be permanently deleted.
        </p>

        {/* 30-day notice */}
        <div style={{
          padding: "10px 14px", borderRadius: 7, marginBottom: 18,
          backgroundColor: "rgba(239,68,68,0.06)",
          border: "1px solid rgba(239,68,68,0.15)",
        }}>
          <p style={{ fontSize: 12, color: "#ef4444", fontFamily: "var(--font-outfit)", margin: 0, lineHeight: 1.5 }}>
            Your account will be deleted on <strong>{deletionDate}</strong>
          </p>
        </div>

        {/* Confirmation checkbox */}
        <label style={{
          display: "flex", alignItems: "flex-start", gap: 10,
          cursor: "pointer", marginBottom: 22,
          userSelect: "none",
        }}>
          <div style={{ marginTop: 1, flexShrink: 0 }}>
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              style={{ accentColor: "#ef4444", width: 15, height: 15, cursor: "pointer" }}
            />
          </div>
          <span style={{
            fontSize: 12, color: "rgba(255,255,255,0.65)",
            fontFamily: "var(--font-outfit)", lineHeight: 1.55,
          }}>
            I understand my account will be permanently deleted
          </span>
        </label>

        {error && (
          <div style={{
            padding: "8px 12px", borderRadius: 6, marginBottom: 16,
            backgroundColor: "rgba(239,68,68,0.06)",
            border: "1px solid rgba(239,68,68,0.18)",
          }}>
            <p style={{ fontSize: 12, color: "#ef4444", fontFamily: "var(--font-outfit)", margin: 0 }}>
              {error}
            </p>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            disabled={deleting}
            style={{
              padding: "8px 16px", borderRadius: 6, fontSize: 12,
              fontFamily: "var(--font-outfit)", cursor: "pointer",
              backgroundColor: "transparent", color: "rgba(255,255,255,0.5)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!checked || deleting}
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              padding: "8px 16px", borderRadius: 6, fontSize: 12,
              fontFamily: "var(--font-outfit)",
              cursor: !checked || deleting ? "not-allowed" : "pointer",
              backgroundColor: "#ef4444", color: "#fff", border: "none",
              opacity: !checked || deleting ? 0.5 : 1,
              transition: "filter 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (checked && !deleting)
                (e.currentTarget as HTMLButtonElement).style.filter = "brightness(1.1)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.filter = "none";
            }}
          >
            {deleting && <Loader2 size={12} strokeWidth={2} style={{ animation: "spin 0.8s linear infinite" }} />}
            {deleting ? "Deleting..." : "Delete Account"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function DataPrivacyPage() {
  const [retention, setRetention] = useState("1year");
  const [loading, setLoading] = useState(true);

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | undefined>();
  const [saveTimestamp, setSaveTimestamp] = useState<Date | undefined>();

  const [exporting, setExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);

  const [deleteModal, setDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.data_retention) {
        setRetention(user.user_metadata.data_retention);
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

  function handleRetentionChange(value: string) {
    setRetention(value);
    save({ data_retention: value });
  }

  async function handleExport() {
    setExporting(true);
    setExportDone(false);
    try {
      const res = await fetch("/api/user/export-data", { method: "POST" });
      if (!res.ok) return;
      const blob = await res.blob();
      const date = new Date().toISOString().split("T")[0];
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nexora-data-export-${date}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportDone(true);
      setTimeout(() => setExportDone(false), 4000);
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "DELETE" }),
      });
      const data = await res.json();
      if (res.ok) {
        const supabase = createClient();
        await supabase.auth.signOut();
        window.location.href = "/login";
      } else {
        setDeleteError(data.error ?? "Failed to delete account");
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
        style={{ maxWidth: 900, paddingBottom: 80 }}
      >
        {/* Page header */}
        <motion.div {...fadeUp(0)} style={{ marginBottom: 40 }}>
          <h1 style={{
            fontSize: 22, fontWeight: 700, color: "#fff",
            fontFamily: "var(--font-syne)", letterSpacing: "-0.02em",
            margin: 0, lineHeight: 1.2,
          }}>
            Data & Privacy
          </h1>
          <p style={{
            fontSize: 13, color: "rgba(255,255,255,0.45)",
            fontFamily: "var(--font-outfit)", margin: "6px 0 0",
          }}>
            Manage your data retention and privacy settings
          </p>
        </motion.div>

        {/* ── SECTION 1: Data Retention ── */}
        <motion.section {...fadeUp(1)} style={{ marginBottom: 48 }}>
          <SectionHeader title="Data Retention" divider />

          {!loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <FormSelect
                label="Keep campaign data for:"
                options={RETENTION_OPTIONS}
                value={retention}
                onChange={handleRetentionChange}
              />

              {/* Warning */}
              <div style={{
                display: "flex", alignItems: "flex-start", gap: 8,
                padding: "10px 14px", borderRadius: 7,
                backgroundColor: "rgba(255,82,0,0.06)",
                border: "1px solid rgba(255,82,0,0.15)",
              }}>
                <AlertTriangle
                  size={13}
                  strokeWidth={1.75}
                  color="#FF5200"
                  aria-hidden="true"
                  style={{ flexShrink: 0, marginTop: 1 }}
                />
                <p style={{
                  fontSize: 12, color: "rgba(255,82,0,0.9)",
                  fontFamily: "var(--font-outfit)", margin: 0, lineHeight: 1.6,
                }}>
                  Deleted data cannot be recovered. Email and lead information is always kept for compliance.
                </p>
              </div>

              <div style={{ paddingTop: 4 }}>
                <SaveStatus status={saveStatus} message={saveError} timestamp={saveTimestamp} />
              </div>
            </div>
          )}
        </motion.section>

        {/* ── SECTION 2: GDPR Compliance ── */}
        <motion.section {...fadeUp(2)} style={{ marginBottom: 48 }}>
          <SectionHeader title="GDPR Compliance" divider />
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Download data */}
            <div style={{
              backgroundColor: "rgba(255,255,255,0.05)",
              borderRadius: 8, padding: 20,
            }}>
              <div style={{
                display: "flex", alignItems: "flex-start",
                justifyContent: "space-between", gap: 16, flexWrap: "wrap",
              }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <p style={{
                    fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.85)",
                    fontFamily: "var(--font-outfit)", margin: "0 0 4px",
                  }}>
                    Download my data
                  </p>
                  <p style={{
                    fontSize: 12, color: "rgba(255,255,255,0.4)",
                    fontFamily: "var(--font-outfit)", margin: 0, lineHeight: 1.55,
                  }}>
                    Export all your data in machine-readable format (JSON)
                  </p>
                  {exportDone && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{
                        fontSize: 11, color: "#4ade80",
                        fontFamily: "var(--font-outfit)", marginTop: 6,
                        display: "flex", alignItems: "center", gap: 5,
                      }}
                    >
                      <ShieldCheck size={11} strokeWidth={2} aria-hidden="true" />
                      Export downloaded successfully
                    </motion.p>
                  )}
                </div>
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: "0 4px 16px rgba(255,82,0,0.3)" }}
                  transition={{ duration: 0.15, ease: EASE }}
                  onClick={handleExport}
                  disabled={exporting}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "9px 18px", borderRadius: 7,
                    backgroundColor: "#FF5200", color: "#fff",
                    fontSize: 13, fontWeight: 500, fontFamily: "var(--font-outfit)",
                    border: "none", cursor: exporting ? "not-allowed" : "pointer",
                    opacity: exporting ? 0.65 : 1, flexShrink: 0,
                  }}
                >
                  {exporting
                    ? <Loader2 size={14} strokeWidth={2} style={{ animation: "spin 0.8s linear infinite" }} />
                    : <Download size={14} strokeWidth={1.75} aria-hidden="true" />
                  }
                  {exporting ? "Preparing..." : "Download my data"}
                </motion.button>
              </div>
            </div>

            {/* Delete account */}
            <div style={{
              backgroundColor: "rgba(239,68,68,0.04)",
              border: "1px solid rgba(239,68,68,0.13)",
              borderRadius: 8, padding: 20,
            }}>
              <div style={{
                display: "flex", alignItems: "flex-start",
                justifyContent: "space-between", gap: 16, flexWrap: "wrap",
              }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <p style={{
                    fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.85)",
                    fontFamily: "var(--font-outfit)", margin: "0 0 4px",
                  }}>
                    Delete my account
                  </p>
                  <p style={{
                    fontSize: 12, color: "rgba(255,255,255,0.4)",
                    fontFamily: "var(--font-outfit)", margin: 0, lineHeight: 1.55,
                  }}>
                    Permanently delete your account and all associated data
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: "0 4px 16px rgba(239,68,68,0.3)" }}
                  transition={{ duration: 0.15, ease: EASE }}
                  onClick={() => { setDeleteModal(true); setDeleteError(null); }}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "9px 18px", borderRadius: 7,
                    backgroundColor: "#ef4444", color: "#fff",
                    fontSize: 13, fontWeight: 500, fontFamily: "var(--font-outfit)",
                    border: "none", cursor: "pointer", flexShrink: 0,
                  }}
                >
                  Delete my account
                </motion.button>
              </div>
            </div>

          </div>
        </motion.section>

        {/* ── SECTION 3: Compliance Status ── */}
        <motion.section {...fadeUp(3)} style={{ marginBottom: 48 }}>
          <SectionHeader title="Compliance Status" divider />
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {COMPLIANCE.map(({ title, status, details }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.18, duration: 0.28, ease: EASE }}
                style={{
                  display: "flex", alignItems: "center", gap: 16,
                  backgroundColor: "rgba(255,255,255,0.04)",
                  borderRadius: 8, padding: "16px 20px",
                }}
              >
                {/* Animated check badge */}
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5 + i * 0.2, duration: 0.32, ease: EASE }}
                  style={{
                    width: 40, height: 40, borderRadius: "50%",
                    backgroundColor: "rgba(0,208,132,0.1)",
                    border: "1px solid rgba(0,208,132,0.25)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <ShieldCheck size={18} strokeWidth={1.75} color="#00D084" aria-hidden="true" />
                </motion.div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span style={{
                      fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.85)",
                      fontFamily: "var(--font-outfit)",
                    }}>
                      {title}
                    </span>
                    <span style={{
                      fontSize: 9, fontWeight: 600, letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      color: "#00D084",
                      backgroundColor: "rgba(0,208,132,0.1)",
                      border: "1px solid rgba(0,208,132,0.2)",
                      borderRadius: 999, padding: "1px 7px",
                      fontFamily: "var(--font-outfit)",
                    }}>
                      {status}
                    </span>
                  </div>
                  <p style={{
                    fontSize: 12, color: "rgba(255,255,255,0.38)",
                    fontFamily: "var(--font-outfit)", margin: 0, lineHeight: 1.5,
                  }}>
                    {details}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Footer links */}
        <motion.div
          {...fadeUp(4)}
          style={{ display: "flex", gap: 20, flexWrap: "wrap" }}
        >
          {[
            { label: "View Privacy Policy", href: "/privacy" },
            { label: "View Terms of Service", href: "/terms" },
          ].map(({ label, href }) => (
            <a
              key={label}
              href={href}
              style={{
                fontSize: 12, color: "rgba(255,255,255,0.35)",
                fontFamily: "var(--font-outfit)", textDecoration: "none",
                transition: "color 0.15s ease",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.65)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.35)"; }}
            >
              {label}
            </a>
          ))}
        </motion.div>
      </motion.div>

      {/* Delete account modal */}
      <AnimatePresence>
        {deleteModal && (
          <DeleteModal
            onClose={() => setDeleteModal(false)}
            onConfirm={handleDelete}
            deleting={deleting}
            error={deleteError}
          />
        )}
      </AnimatePresence>
    </>
  );
}
