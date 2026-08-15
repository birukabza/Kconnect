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

  return (
    <div className="absolute right-4 flex min-w-0 items-center gap-2">
      <span className="hidden max-w-32 truncate text-sm font-medium text-rw-ink/65 sm:block">
        {user?.name}
      </span>
      <button
        type="button"
        onClick={handleLogout}
        aria-label="Sign out"
        title="Sign out"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-rw-ink/55 transition-colors hover:bg-rw-blue/10 hover:text-rw-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-rw-yellow"
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
