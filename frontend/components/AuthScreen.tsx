"use client";

import { FormEvent, useState } from "react";
import clsx from "clsx";
import {
  AlertCircle,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  User,
} from "lucide-react";

import { loginAccount, registerAccount } from "@/lib/auth";
import { useAuthStore } from "@/lib/authStore";
import { BrandMark } from "./BrandMark";
import { Spinner } from "./ui/Spinner";

type AuthMode = "login" | "register";

const modes: Array<{ value: AuthMode; label: string }> = [
  { value: "login", label: "Sign in" },
  { value: "register", label: "Create account" },
];

const inputClassName =
  "h-12 w-full rounded-[8px] border border-rw-line bg-white pl-11 pr-3 text-sm text-rw-ink outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-rw-muted/55 focus:border-rw-blue focus:shadow-[0_0_0_3px_rgba(23,105,210,0.13)]";

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
    <main className="flex min-h-dvh flex-col bg-rw-bg">
      <header className="border-b border-rw-line bg-rw-paper">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center px-5 sm:px-8">
          <BrandMark />
        </div>
      </header>

      <section
        className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-12"
        aria-labelledby="auth-title"
      >
        <div className="w-full max-w-[440px] rounded-[10px] bg-rw-paper p-5 shadow-[0_14px_40px_rgba(20,33,29,0.09)] sm:p-8">
          <h1
            id="auth-title"
            className="text-[1.75rem] font-semibold leading-tight text-rw-ink sm:text-[2rem]"
          >
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-rw-muted">
            {mode === "login"
              ? "Sign in to continue."
              : "Enter your details to get started."}
          </p>

          <div
            className="mt-7 grid grid-cols-2 border-b border-rw-line"
            role="tablist"
            aria-label="Account action"
          >
            {modes.map((option) => {
              const selected = mode === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => changeMode(option.value)}
                  className={clsx(
                    "relative min-h-12 px-3 text-sm font-semibold transition-colors",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-rw-blue",
                    selected
                      ? "text-rw-green after:absolute after:inset-x-0 after:bottom-[-1px] after:h-0.5 after:bg-rw-blue"
                      : "text-rw-muted hover:text-rw-ink"
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
            {mode === "register" && (
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-rw-ink">
                  Name
                </span>
                <span className="relative block">
                  <User
                    className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-rw-muted"
                    aria-hidden="true"
                  />
                  <input
                    required
                    minLength={2}
                    maxLength={50}
                    autoComplete="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your name"
                    className={inputClassName}
                  />
                </span>
              </label>
            )}

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-rw-ink">
                Email
              </span>
              <span className="relative block">
                <Mail
                  className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-rw-muted"
                  aria-hidden="true"
                />
                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className={inputClassName}
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-rw-ink">
                Password
              </span>
              <span className="relative block">
                <LockKeyhole
                  className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-rw-muted"
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
                  placeholder={
                    mode === "register" ? "At least 8 characters" : "Your password"
                  }
                  className={`${inputClassName} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-[6px] text-rw-muted transition-colors hover:bg-rw-bg hover:text-rw-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-rw-blue"
                >
                  {showPassword ? (
                    <EyeOff className="h-[18px] w-[18px]" aria-hidden="true" />
                  ) : (
                    <Eye className="h-[18px] w-[18px]" aria-hidden="true" />
                  )}
                </button>
              </span>
            </label>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 border-y border-rose-200 bg-rose-50 px-3 py-3 text-sm leading-5 text-rose-800"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-[8px] bg-rw-green px-4 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(11,74,57,0.18)] transition-[background-color,transform,box-shadow] duration-200 hover:bg-[#073B2D] hover:shadow-[0_10px_24px_rgba(11,74,57,0.24)] active:translate-y-px focus:outline-none focus-visible:ring-[3px] focus-visible:ring-rw-yellow disabled:cursor-wait disabled:opacity-65"
            >
              {submitting && <Spinner className="h-4 w-4" />}
              {mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
