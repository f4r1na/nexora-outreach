"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { logout } from "@/app/actions/auth";
import { Check, Loader2, X, Shield, Mail, Lock, Trash2, ShieldCheck } from "lucide-react";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: 6,
  backgroundColor: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#ccc",
  fontFamily: "var(--font-outfit)",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 11, color: "#555",
  fontFamily: "var(--font-outfit)", marginBottom: 5,
};

const cardStyle: React.CSSProperties = {
  backgroundColor: "#0e0e18",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 10, padding: "20px 22px", marginBottom: 20,
};

function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        backgroundColor: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}
    >
      <div style={{
        backgroundColor: "#0e0e18",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12, padding: "28px 28px",
        width: "100%", maxWidth: 400,
        position: "relative",
      }}>
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 14, right: 14,
            background: "none", border: "none", cursor: "pointer", color: "#555",
            display: "flex",
          }}
        >
          <X size={16} strokeWidth={1.75} />
        </button>
        {children}
      </div>
    </div>
  );
}

export default function AccountPage() {
  const [email, setEmail] = useState("");
  const [mfaFactors, setMfaFactors] = useState<{ id: string; friendly_name?: string }[]>([]);
  const [mfaLoading, setMfaLoading] = useState(true);

  // Modals
  const [showEmail, setShowEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  // Change email
  const [newEmail, setNewEmail] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMsg, setEmailMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Change password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // 2FA
  const [qrCode, setQrCode] = useState("");
  const [totpSecret, setTotpSecret] = useState("");
  const [factorId, setFactorId] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [mfaEnrolling, setMfaEnrolling] = useState(false);
  const [mfaVerifying, setMfaVerifying] = useState(false);
  const [mfaMsg, setMfaMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [mfaStep, setMfaStep] = useState<"idle" | "scan" | "verify">("idle");

  // Delete
  const [deleteText, setDeleteText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setEmail(user.email ?? "");
    });
    supabase.auth.mfa.listFactors().then(({ data }) => {
      setMfaFactors(data?.totp ?? []);
      setMfaLoading(false);
    }).catch(() => setMfaLoading(false));
  }, []);

  async function handleChangeEmail() {
    setEmailSaving(true);
    setEmailMsg(null);
    try {
      const res = await fetch("/api/auth/change-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setEmailMsg({ ok: true, text: "Email updated successfully." });
        setEmail(newEmail);
        setNewEmail("");
        setTimeout(() => setShowEmail(false), 2000);
      } else {
        setEmailMsg({ ok: false, text: data.error ?? "Failed to update email." });
      }
    } finally {
      setEmailSaving(false);
    }
  }

  async function handleChangePassword() {
    if (newPassword !== confirmPassword) {
      setPwMsg({ ok: false, text: "Passwords do not match." });
      return;
    }
    if (newPassword.length < 8) {
      setPwMsg({ ok: false, text: "Password must be at least 8 characters." });
      return;
    }
    setPwSaving(true);
    setPwMsg(null);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setPwMsg({ ok: true, text: "Password updated." });
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setShowPassword(false), 2000);
      } else {
        setPwMsg({ ok: false, text: data.error ?? "Failed to update password." });
      }
    } finally {
      setPwSaving(false);
    }
  }

  async function handleEnroll2FA() {
    setMfaEnrolling(true);
    setMfaMsg(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
      if (error || !data) {
        setMfaMsg({ ok: false, text: error?.message ?? "Failed to start 2FA enrollment." });
        return;
      }
      setQrCode(data.totp.qr_code);
      setTotpSecret(data.totp.secret);
      setFactorId(data.id);
      setMfaStep("scan");
    } finally {
      setMfaEnrolling(false);
    }
  }

  async function handleVerify2FA() {
    if (!totpCode || totpCode.length < 6) {
      setMfaMsg({ ok: false, text: "Enter the 6-digit code from your app." });
      return;
    }
    setMfaVerifying(true);
    setMfaMsg(null);
    try {
      const supabase = createClient();
      const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({ factorId });
      if (cErr || !challenge) {
        setMfaMsg({ ok: false, text: cErr?.message ?? "Challenge failed." });
        return;
      }
      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: totpCode,
      });
      if (vErr) {
        setMfaMsg({ ok: false, text: vErr.message ?? "Invalid code." });
        return;
      }
      setMfaMsg({ ok: true, text: "2FA enabled successfully." });
      setMfaFactors((prev) => [...prev, { id: factorId, friendly_name: undefined }]);
      setTimeout(() => setShow2FA(false), 2000);
    } finally {
      setMfaVerifying(false);
    }
  }

  async function handleUnenroll2FA(id: string) {
    const supabase = createClient();
    await supabase.auth.mfa.unenroll({ factorId: id });
    setMfaFactors((prev) => prev.filter((f) => f.id !== id));
  }

  async function handleDeleteAccount() {
    if (deleteText !== "DELETE") {
      setDeleteMsg("Type DELETE to confirm.");
      return;
    }
    setDeleting(true);
    setDeleteMsg(null);
    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "DELETE" }),
      });
      const data = await res.json();
      if (res.ok) {
        // Sign out and redirect
        const supabase = createClient();
        await supabase.auth.signOut();
        window.location.href = "/login";
      } else {
        setDeleteMsg(data.error ?? "Failed to delete account.");
        setDeleting(false);
      }
    } catch {
      setDeleteMsg("An error occurred. Please try again.");
      setDeleting(false);
    }
  }

  const mfaEnabled = mfaFactors.length > 0;

  return (
    <>
      <header style={{
        padding: "0 32px", height: 68,
        display: "flex", alignItems: "center",
        borderBottom: "1px solid rgba(255,255,255,0.055)",
        backgroundColor: "rgba(8,8,16,0.94)",
        backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 30,
      }}>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 500, color: "#fff", fontFamily: "var(--font-syne)", letterSpacing: "-0.02em", lineHeight: 1 }}>
            Account Security
          </h1>
          <p style={{ fontSize: 11, color: "#383838", fontFamily: "var(--font-outfit)", marginTop: 3 }}>
            Manage your email, password, and authentication
          </p>
        </div>
      </header>

      <div style={{ padding: "28px 32px 64px", maxWidth: 560 }}>

        {/* Email & Password */}
        <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.07em", textTransform: "uppercase", color: "#444", fontFamily: "var(--font-outfit)", marginBottom: 10 }}>
          Email &amp; Password
        </p>
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Mail size={14} strokeWidth={1.5} color="#555" />
              <div>
                <p style={{ fontSize: 13, color: "#ccc", fontFamily: "var(--font-outfit)" }}>Email address</p>
                <p style={{ fontSize: 12, color: "#555", fontFamily: "var(--font-outfit)" }}>{email || "Loading..."}</p>
              </div>
            </div>
            <button
              onClick={() => { setShowEmail(true); setEmailMsg(null); }}
              style={{
                padding: "6px 14px", borderRadius: 6, fontSize: 12,
                fontFamily: "var(--font-outfit)", cursor: "pointer",
                backgroundColor: "transparent", color: "#888",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              Change
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Lock size={14} strokeWidth={1.5} color="#555" />
              <div>
                <p style={{ fontSize: 13, color: "#ccc", fontFamily: "var(--font-outfit)" }}>Password</p>
                <p style={{ fontSize: 12, color: "#555", fontFamily: "var(--font-outfit)" }}>Last changed: unknown</p>
              </div>
            </div>
            <button
              onClick={() => { setShowPassword(true); setPwMsg(null); }}
              style={{
                padding: "6px 14px", borderRadius: 6, fontSize: 12,
                fontFamily: "var(--font-outfit)", cursor: "pointer",
                backgroundColor: "transparent", color: "#888",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              Change
            </button>
          </div>
        </div>

        {/* 2FA */}
        <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.07em", textTransform: "uppercase", color: "#444", fontFamily: "var(--font-outfit)", marginBottom: 10 }}>
          Two-Factor Authentication
        </p>
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {mfaEnabled
                ? <ShieldCheck size={14} strokeWidth={1.5} color="#4ade80" />
                : <Shield size={14} strokeWidth={1.5} color="#555" />
              }
              <div>
                <p style={{ fontSize: 13, color: "#ccc", fontFamily: "var(--font-outfit)" }}>
                  Authenticator app
                </p>
                <p style={{ fontSize: 12, color: mfaEnabled ? "#4ade80" : "#555", fontFamily: "var(--font-outfit)" }}>
                  {mfaLoading ? "Checking..." : mfaEnabled ? "Enabled" : "Not configured"}
                </p>
              </div>
            </div>
            {!mfaLoading && (
              mfaEnabled ? (
                <button
                  onClick={() => handleUnenroll2FA(mfaFactors[0].id)}
                  style={{
                    padding: "6px 14px", borderRadius: 6, fontSize: 12,
                    fontFamily: "var(--font-outfit)", cursor: "pointer",
                    backgroundColor: "transparent", color: "#f87171",
                    border: "1px solid rgba(239,68,68,0.2)",
                  }}
                >
                  Disable
                </button>
              ) : (
                <button
                  onClick={() => { setShow2FA(true); setMfaMsg(null); setMfaStep("idle"); }}
                  style={{
                    padding: "6px 14px", borderRadius: 6, fontSize: 12,
                    fontFamily: "var(--font-outfit)", cursor: "pointer",
                    backgroundColor: "#FF5200", color: "#fff",
                    border: "none",
                  }}
                >
                  Enable 2FA
                </button>
              )
            )}
          </div>
        </div>

        {/* Delete Account */}
        <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.07em", textTransform: "uppercase", color: "#444", fontFamily: "var(--font-outfit)", marginBottom: 10 }}>
          Danger Zone
        </p>
        <div style={{ ...cardStyle, border: "1px solid rgba(239,68,68,0.15)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Trash2 size={14} strokeWidth={1.5} color="#f87171" />
              <div>
                <p style={{ fontSize: 13, color: "#ccc", fontFamily: "var(--font-outfit)" }}>Delete account</p>
                <p style={{ fontSize: 12, color: "#555", fontFamily: "var(--font-outfit)" }}>
                  Permanently removes all data. This cannot be undone.
                </p>
              </div>
            </div>
            <button
              onClick={() => { setShowDelete(true); setDeleteMsg(null); setDeleteText(""); }}
              style={{
                padding: "6px 14px", borderRadius: 6, fontSize: 12,
                fontFamily: "var(--font-outfit)", cursor: "pointer",
                backgroundColor: "transparent", color: "#f87171",
                border: "1px solid rgba(239,68,68,0.25)",
                flexShrink: 0,
              }}
            >
              Delete
            </button>
          </div>
        </div>

      </div>

      {/* ── Change Email Modal ── */}
      {showEmail && (
        <Modal onClose={() => setShowEmail(false)}>
          <h2 style={{ fontSize: 15, fontWeight: 500, color: "#ddd", fontFamily: "var(--font-syne)", marginBottom: 6 }}>
            Change email
          </h2>
          <p style={{ fontSize: 12, color: "#555", fontFamily: "var(--font-outfit)", marginBottom: 20, lineHeight: 1.5 }}>
            Your email will be updated immediately.
          </p>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>New email address</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="new@example.com"
              style={inputStyle}
              autoFocus
            />
          </div>
          {emailMsg && (
            <div style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "8px 12px", borderRadius: 6, marginBottom: 14,
              backgroundColor: emailMsg.ok ? "rgba(74,222,128,0.06)" : "rgba(239,68,68,0.06)",
              border: `1px solid ${emailMsg.ok ? "rgba(74,222,128,0.15)" : "rgba(239,68,68,0.15)"}`,
            }}>
              <span style={{ fontSize: 12, color: emailMsg.ok ? "#4ade80" : "#f87171", fontFamily: "var(--font-outfit)" }}>
                {emailMsg.text}
              </span>
            </div>
          )}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={() => setShowEmail(false)} style={{ padding: "8px 16px", borderRadius: 6, fontSize: 12, fontFamily: "var(--font-outfit)", cursor: "pointer", backgroundColor: "transparent", color: "#666", border: "1px solid rgba(255,255,255,0.08)" }}>
              Cancel
            </button>
            <button
              onClick={handleChangeEmail}
              disabled={emailSaving || !newEmail}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 6, fontSize: 12, fontFamily: "var(--font-outfit)", cursor: emailSaving ? "not-allowed" : "pointer", backgroundColor: "#FF5200", color: "#fff", border: "none", opacity: emailSaving ? 0.6 : 1 }}
            >
              {emailSaving && <Loader2 size={11} style={{ animation: "spin 0.8s linear infinite" }} />}
              Update email
            </button>
          </div>
        </Modal>
      )}

      {/* ── Change Password Modal ── */}
      {showPassword && (
        <Modal onClose={() => setShowPassword(false)}>
          <h2 style={{ fontSize: 15, fontWeight: 500, color: "#ddd", fontFamily: "var(--font-syne)", marginBottom: 6 }}>
            Change password
          </h2>
          <p style={{ fontSize: 12, color: "#555", fontFamily: "var(--font-outfit)", marginBottom: 20, lineHeight: 1.5 }}>
            Must be at least 8 characters.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>New password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                style={inputStyle}
                autoFocus
              />
            </div>
            <div>
              <label style={labelStyle}>Confirm password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                style={inputStyle}
              />
            </div>
          </div>
          {pwMsg && (
            <div style={{
              padding: "8px 12px", borderRadius: 6, marginBottom: 14,
              backgroundColor: pwMsg.ok ? "rgba(74,222,128,0.06)" : "rgba(239,68,68,0.06)",
              border: `1px solid ${pwMsg.ok ? "rgba(74,222,128,0.15)" : "rgba(239,68,68,0.15)"}`,
            }}>
              <span style={{ fontSize: 12, color: pwMsg.ok ? "#4ade80" : "#f87171", fontFamily: "var(--font-outfit)" }}>
                {pwMsg.text}
              </span>
            </div>
          )}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={() => setShowPassword(false)} style={{ padding: "8px 16px", borderRadius: 6, fontSize: 12, fontFamily: "var(--font-outfit)", cursor: "pointer", backgroundColor: "transparent", color: "#666", border: "1px solid rgba(255,255,255,0.08)" }}>
              Cancel
            </button>
            <button
              onClick={handleChangePassword}
              disabled={pwSaving}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 6, fontSize: 12, fontFamily: "var(--font-outfit)", cursor: pwSaving ? "not-allowed" : "pointer", backgroundColor: "#FF5200", color: "#fff", border: "none", opacity: pwSaving ? 0.6 : 1 }}
            >
              {pwSaving && <Loader2 size={11} style={{ animation: "spin 0.8s linear infinite" }} />}
              Update password
            </button>
          </div>
        </Modal>
      )}

      {/* ── 2FA Modal ── */}
      {show2FA && (
        <Modal onClose={() => setShow2FA(false)}>
          <h2 style={{ fontSize: 15, fontWeight: 500, color: "#ddd", fontFamily: "var(--font-syne)", marginBottom: 6 }}>
            Enable two-factor auth
          </h2>

          {mfaStep === "idle" && (
            <>
              <p style={{ fontSize: 12, color: "#555", fontFamily: "var(--font-outfit)", marginBottom: 20, lineHeight: 1.5 }}>
                Use an authenticator app like Google Authenticator or Authy to add an extra layer of security.
              </p>
              {mfaMsg && (
                <div style={{ padding: "8px 12px", borderRadius: 6, marginBottom: 14, backgroundColor: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
                  <span style={{ fontSize: 12, color: "#f87171", fontFamily: "var(--font-outfit)" }}>{mfaMsg.text}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  onClick={handleEnroll2FA}
                  disabled={mfaEnrolling}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 6, fontSize: 12, fontFamily: "var(--font-outfit)", cursor: mfaEnrolling ? "not-allowed" : "pointer", backgroundColor: "#FF5200", color: "#fff", border: "none", opacity: mfaEnrolling ? 0.6 : 1 }}
                >
                  {mfaEnrolling && <Loader2 size={11} style={{ animation: "spin 0.8s linear infinite" }} />}
                  {mfaEnrolling ? "Generating..." : "Get QR code"}
                </button>
              </div>
            </>
          )}

          {mfaStep === "scan" && (
            <>
              <p style={{ fontSize: 12, color: "#555", fontFamily: "var(--font-outfit)", marginBottom: 16, lineHeight: 1.5 }}>
                Scan this QR code with your authenticator app, then enter the 6-digit code below.
              </p>
              {qrCode && (
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                  {/* qr_code is a data URI returned by Supabase */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrCode} alt="2FA QR code" width={160} height={160} style={{ borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)" }} />
                </div>
              )}
              <div style={{ marginBottom: 6, padding: "8px 12px", borderRadius: 6, backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p style={{ fontSize: 10, color: "#444", fontFamily: "var(--font-outfit)", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>Manual entry key</p>
                <p style={{ fontSize: 11, color: "#888", fontFamily: "var(--font-outfit)", wordBreak: "break-all" }}>{totpSecret}</p>
              </div>
              <div style={{ marginTop: 14, marginBottom: 14 }}>
                <label style={labelStyle}>6-digit verification code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  style={{ ...inputStyle, letterSpacing: "0.2em", fontSize: 16 }}
                  autoFocus
                />
              </div>
              {mfaMsg && (
                <div style={{
                  padding: "8px 12px", borderRadius: 6, marginBottom: 14,
                  backgroundColor: mfaMsg.ok ? "rgba(74,222,128,0.06)" : "rgba(239,68,68,0.06)",
                  border: `1px solid ${mfaMsg.ok ? "rgba(74,222,128,0.15)" : "rgba(239,68,68,0.15)"}`,
                }}>
                  <span style={{ fontSize: 12, color: mfaMsg.ok ? "#4ade80" : "#f87171", fontFamily: "var(--font-outfit)" }}>{mfaMsg.text}</span>
                </div>
              )}
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={() => setMfaStep("idle")} style={{ padding: "8px 16px", borderRadius: 6, fontSize: 12, fontFamily: "var(--font-outfit)", cursor: "pointer", backgroundColor: "transparent", color: "#666", border: "1px solid rgba(255,255,255,0.08)" }}>
                  Back
                </button>
                <button
                  onClick={handleVerify2FA}
                  disabled={mfaVerifying || totpCode.length < 6}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 6, fontSize: 12, fontFamily: "var(--font-outfit)", cursor: mfaVerifying ? "not-allowed" : "pointer", backgroundColor: "#FF5200", color: "#fff", border: "none", opacity: (mfaVerifying || totpCode.length < 6) ? 0.6 : 1 }}
                >
                  {mfaVerifying && <Loader2 size={11} style={{ animation: "spin 0.8s linear infinite" }} />}
                  Verify &amp; enable
                </button>
              </div>
            </>
          )}
        </Modal>
      )}

      {/* ── Delete Modal ── */}
      {showDelete && (
        <Modal onClose={() => setShowDelete(false)}>
          <h2 style={{ fontSize: 15, fontWeight: 500, color: "#f87171", fontFamily: "var(--font-syne)", marginBottom: 6 }}>
            Delete account permanently
          </h2>
          <p style={{ fontSize: 12, color: "#555", fontFamily: "var(--font-outfit)", marginBottom: 16, lineHeight: 1.5 }}>
            This will permanently delete your account and all data including campaigns, leads, and billing history. This action cannot be undone.
          </p>
          <div style={{ marginBottom: 14 }}>
            <label style={{ ...labelStyle, color: "#f87171" }}>Type DELETE to confirm</label>
            <input
              type="text"
              value={deleteText}
              onChange={(e) => setDeleteText(e.target.value)}
              placeholder="DELETE"
              style={{ ...inputStyle, border: "1px solid rgba(239,68,68,0.2)" }}
              autoFocus
            />
          </div>
          {deleteMsg && (
            <div style={{ padding: "8px 12px", borderRadius: 6, marginBottom: 14, backgroundColor: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
              <span style={{ fontSize: 12, color: "#f87171", fontFamily: "var(--font-outfit)" }}>{deleteMsg}</span>
            </div>
          )}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={() => setShowDelete(false)} style={{ padding: "8px 16px", borderRadius: 6, fontSize: 12, fontFamily: "var(--font-outfit)", cursor: "pointer", backgroundColor: "transparent", color: "#666", border: "1px solid rgba(255,255,255,0.08)" }}>
              Cancel
            </button>
            <button
              onClick={handleDeleteAccount}
              disabled={deleting || deleteText !== "DELETE"}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 6, fontSize: 12, fontFamily: "var(--font-outfit)", cursor: (deleting || deleteText !== "DELETE") ? "not-allowed" : "pointer", backgroundColor: "#ef4444", color: "#fff", border: "none", opacity: (deleting || deleteText !== "DELETE") ? 0.5 : 1 }}
            >
              {deleting && <Loader2 size={11} style={{ animation: "spin 0.8s linear infinite" }} />}
              {deleting ? "Deleting..." : "Delete my account"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
