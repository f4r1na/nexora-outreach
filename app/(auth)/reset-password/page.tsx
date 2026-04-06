"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error: err } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (err) {
      setError(err.message);
    } else {
      router.push("/dashboard");
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

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-syne)" }}>
            Set new password
          </h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
            Choose a strong password for your account
          </p>
        </div>

        <div className="rounded-2xl p-8" style={{ backgroundColor: "var(--black-2)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>
                New Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="nx-input"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirm" className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>
                Confirm Password
              </label>
              <input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                placeholder="••••••••"
                className="nx-input"
              />
            </div>

            {error && <p className="nx-error" role="alert">{error}</p>}

            <button type="submit" disabled={loading} className="nx-btn mt-2">
              {loading ? "Updating…" : "Update Password"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-6" style={{ color: "rgba(255,255,255,0.35)" }}>
          <Link href="/login" style={{ color: "var(--orange)" }}>
            ← Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
