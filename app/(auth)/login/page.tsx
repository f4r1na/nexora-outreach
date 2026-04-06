"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "@/app/actions/auth";

const initialState = { error: null };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <div
      className="dot-grid min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "var(--black)" }}
    >
      <div className="fade-up w-full max-w-md">
        {/* Logo mark */}
        <div className="flex justify-center mb-8">
          <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Nexora"
          >
            <rect width="48" height="48" rx="12" fill="#FF5200" />
            <path
              d="M13 36V12h4.5l13 16.5V12H35v24h-4.5L17.5 19.5V36H13z"
              fill="white"
            />
          </svg>
        </div>

        {/* Heading */}
        <div className="text-center mb-8">
          <h1
            className="text-3xl font-bold text-white mb-2"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            Welcome back
          </h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
            Sign in to your Nexora account
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            backgroundColor: "var(--black-2)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="text-sm font-medium"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                className="nx-input"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-sm font-medium"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs transition-colors"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="nx-input"
              />
            </div>

            {state?.error && (
              <p className="nx-error" role="alert">
                {state.error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="nx-btn mt-2"
            >
              {pending ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        {/* Footer link */}
        <p
          className="text-center text-sm mt-6"
          style={{ color: "rgba(255,255,255,0.35)" }}
        >
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-medium transition-colors"
            style={{ color: "var(--orange)" }}
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
