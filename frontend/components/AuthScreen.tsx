"use client";

import { FormEvent, useState } from "react";
import clsx from "clsx";
import {
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  User,
} from "lucide-react";

import { loginAccount, registerAccount } from "@/lib/auth";
import { useAuthStore } from "@/lib/authStore";


type AuthMode = "login" | "register";


export function AuthScreen() {
  const setSession = useAuthStore((state) => state.setSession);

  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const session =
        mode === "register"
          ? await registerAccount({ name, email, password })
          : await loginAccount({ email, password });

      setSession(session);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not complete authentication."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-rw-bg px-4 py-8">
      <section className="w-full max-w-sm" aria-labelledby="auth-title">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-bold text-rw-blue">KConnect</span>
            <span className="rounded-full bg-rw-yellow px-2 py-0.5 text-[10px] font-bold uppercase text-rw-ink">
              AI
            </span>
          </div>
          <h1 id="auth-title" className="mt-4 text-xl font-semibold text-rw-ink">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
        </div>

        <div className="rounded-[8px] border border-rw-blue/15 bg-white p-5 shadow-sm">
          <div
            className="grid grid-cols-2 rounded-[6px] bg-rw-ink/5 p-1"
            role="tablist"
            aria-label="Account action"
          >
            {(["login", "register"] as AuthMode[]).map((option) => (
              <button
                key={option}
                type="button"
                role="tab"
                aria-selected={mode === option}
                onClick={() => changeMode(option)}
                className={clsx(
                  "min-h-10 rounded-[4px] text-sm font-semibold transition-colors",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-rw-blue",
                  mode === option
                    ? "bg-white text-rw-blue shadow-sm"
                    : "text-rw-ink/55 hover:text-rw-ink"
                )}
              >
                {option === "login" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>

          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            {mode === "register" && (
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-rw-ink">
                  Name
                </span>
                <span className="relative block">
                  <User
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rw-ink/40"
                    aria-hidden="true"
                  />
                  <input
                    required
                    minLength={2}
                    maxLength={50}
                    autoComplete="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="h-11 w-full rounded-[6px] border border-rw-ink/15 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-rw-blue focus:ring-2 focus:ring-rw-blue/15"
                  />
                </span>
              </label>
            )}

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-rw-ink">
                Email
              </span>
              <span className="relative block">
                <Mail
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rw-ink/40"
                  aria-hidden="true"
                />
                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-11 w-full rounded-[6px] border border-rw-ink/15 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-rw-blue focus:ring-2 focus:ring-rw-blue/15"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-rw-ink">
                Password
              </span>
              <span className="relative block">
                <LockKeyhole
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rw-ink/40"
                  aria-hidden="true"
                />
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  minLength={mode === "register" ? 8 : 1}
                  maxLength={72}
                  autoComplete={
                    mode === "register" ? "new-password" : "current-password"
                  }
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-11 w-full rounded-[6px] border border-rw-ink/15 bg-white pl-10 pr-11 text-sm outline-none transition focus:border-rw-blue focus:ring-2 focus:ring-rw-blue/15"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-[6px] text-rw-ink/45 hover:bg-rw-ink/5 hover:text-rw-ink"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </span>
              {mode === "register" && (
                <span className="mt-1.5 block text-xs text-rw-ink/50">
                  Use at least 8 characters.
                </span>
              )}
            </label>

            {error && (
              <p
                role="alert"
                className="rounded-[6px] bg-rose-50 px-3 py-2 text-sm text-rose-700"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-[6px] bg-rw-blue px-4 text-sm font-semibold text-white transition-colors hover:bg-rw-blue/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-rw-yellow disabled:cursor-wait disabled:opacity-70"
            >
              {submitting && (
                <LoaderCircle
                  className="h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              )}
              {mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
