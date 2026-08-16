"use client";

import { ReactNode, useEffect, useState } from "react";

import { getCurrentUser } from "@/lib/auth";
import { useAuthStore } from "@/lib/authStore";
import { clearTemporaryConversationId } from "@/lib/temporaryConversation";
import { AuthScreen } from "./AuthScreen";
import { BrandMark } from "./BrandMark";
import { Spinner } from "./ui/Spinner";

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
      <main className="flex min-h-dvh items-center justify-center bg-rw-paper">
        <div className="flex flex-col items-center gap-5" role="status">
          <BrandMark />
          <div className="flex items-center gap-2 text-sm font-medium text-rw-muted">
            <Spinner className="h-4 w-4 text-rw-blue" />
            <span>Opening your desk</span>
          </div>
        </div>
      </main>
    );
  }

  if (!accessToken) {
    return <AuthScreen />;
  }

  return children;
}
