"use client";

import { ReactNode, useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";

import { getCurrentUser } from "@/lib/auth";
import { useAuthStore } from "@/lib/authStore";
import { clearTemporaryConversationId } from "@/lib/temporaryConversation";
import { AuthScreen } from "./AuthScreen";


export function AuthGate({ children }: { children: ReactNode }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const hydrated = useAuthStore((state) => state.hydrated);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);

  const [verifiedToken, setVerifiedToken] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated || !accessToken) {
      setVerifiedToken(null);

      if (hydrated && !accessToken) {
        clearTemporaryConversationId();
      }

      return;
    }

    let cancelled = false;

    getCurrentUser(accessToken)
      .then((user) => {
        if (!cancelled) {
          setUser(user);
          setVerifiedToken(accessToken);
        }
      })
      .catch(() => {
        if (!cancelled) {
          clearTemporaryConversationId();
          logout();
          setVerifiedToken(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, hydrated, logout, setUser]);

  if (!hydrated || (accessToken && verifiedToken !== accessToken)) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-rw-bg">
        <LoaderCircle
          className="h-6 w-6 animate-spin text-rw-blue"
          aria-label="Checking account"
        />
      </main>
    );
  }

  if (!accessToken) {
    return <AuthScreen />;
  }

  return children;
}
