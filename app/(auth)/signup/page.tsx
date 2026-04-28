"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup } from "@/app/actions/auth";

const initialState = { error: null };

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signup, initialState);

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
            Create an account
          </h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
            Start your Nexora journey today
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
              <label
                htmlFor="password"
                className="text-sm font-medium"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                placeholder="••••••••"
                className="nx-input"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="confirmPassword"
                className="text-sm font-medium"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                Confirm password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                placeholder="••••••••"
                className="nx-input"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="founderType"
                className="text-sm font-medium"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                I sell to...
              </label>
              <select
                id="founderType"
                name="founderType"
                className="nx-input"
                defaultValue="saas"
                style={{ cursor: "pointer" }}
              >
                <option value="saas">SaaS founders &amp; technical buyers</option>
                <option value="agency">Agency owners &amp; service businesses</option>
                <option value="investor">Investors &amp; fund managers</option>
              </select>
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
              {pending ? "Creating account…" : "Create account"}
            </button>
          </form>
        </div>

        {/* Footer link */}
        <p
          className="text-center text-sm mt-6"
          style={{ color: "rgba(255,255,255,0.35)" }}
        >
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium transition-colors"
            style={{ color: "var(--orange)" }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
