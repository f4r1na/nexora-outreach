"use client";

import { useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });

    setLoading(false);

    if (err) {
      setError(err.message);
    } else {
      setSent(true);
    }
  }

  return (
    <div
      className="dot-grid min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "var(--black)" }}
    >
      <div className="fade-up w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-label="Nexora">
            <rect width="48" height="48" rx="12" fill="#FF5200" />
            <path d="M13 36V12h4.5l13 16.5V12H35v24h-4.5L17.5 19.5V36H13z" fill="white" />
          </svg>
        </div>

        {sent ? (
          /* ── Success state ── */
          <div className="text-center">
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              backgroundColor: "rgba(74,222,128,0.12)",
              border: "1px solid rgba(74,222,128,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="#4ade80" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-syne)" }}>
              Check your email
            </h1>
            <p className="text-sm mb-2" style={{ color: "rgba(255,255,255,0.45)" }}>
              We sent a reset link to
            </p>
            <p className="text-sm font-semibold mb-8" style={{ color: "#FF5200" }}>{email}</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
              Didn&apos;t get it? Check your spam folder or{" "}
              <button
                onClick={() => { setSent(false); setError(null); }}
                style={{ color: "#FF5200", background: "none", border: "none", cursor: "pointer", fontSize: "inherit", padding: 0 }}
              >
                try again
              </button>.
            </p>
            <Link href="/login" className="block mt-8 text-sm" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>
              ← Back to login
            </Link>
          </div>
        ) : (
          /* ── Form state ── */
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-syne)" }}>
                Reset your password
              </h1>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                Enter your email and we&apos;ll send you a reset link
              </p>
            </div>

            <div className="rounded-2xl p-8" style={{ backgroundColor: "var(--black-2)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="nx-input"
                  />
                </div>

                {error && <p className="nx-error" role="alert">{error}</p>}

                <button type="submit" disabled={loading} className="nx-btn mt-2">
                  {loading ? "Sending…" : "Send Reset Link"}
                </button>
              </form>
            </div>

            <p className="text-center text-sm mt-6" style={{ color: "rgba(255,255,255,0.35)" }}>
              <Link href="/login" style={{ color: "var(--orange)" }}>
                ← Back to login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
