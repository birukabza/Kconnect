"use client";

import { LogOut } from "lucide-react";

import { useAuthStore } from "@/lib/authStore";
import { useConversationStore } from "@/lib/conversationStore";
import { clearTemporaryConversationId } from "@/lib/temporaryConversation";

export function AccountMenu() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const clearSession = useConversationStore((state) => state.clearSession);

  const handleLogout = () => {
    clearSession();
    clearTemporaryConversationId();
    logout();
  };

  const initials = (user?.name || user?.email || "K")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
      <div className="hidden min-w-0 text-right sm:block">
        <p className="max-w-36 truncate text-sm font-semibold text-rw-ink">
          {user?.name || "Account"}
        </p>
        <p className="max-w-36 truncate text-[11px] text-rw-muted">
          {user?.email}
        </p>
      </div>

      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rw-green text-xs font-bold text-white"
        aria-hidden="true"
      >
        {initials}
      </span>

      <button
        type="button"
        onClick={handleLogout}
        aria-label="Sign out"
        title="Sign out"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[7px] text-rw-muted transition-colors hover:bg-rw-bg hover:text-rw-green focus:outline-none focus-visible:ring-2 focus-visible:ring-rw-blue"
      >
        <LogOut className="h-[18px] w-[18px]" aria-hidden="true" />
      </button>
    </div>
  );
}
