import { AlertTriangle, X } from "lucide-react";

interface ToastProps {
  message: string;
  onDismiss: () => void;
}
export function Toast({ message, onDismiss }: ToastProps) {
  return (
    <div
      role="alert"
      className="toast-enter fixed bottom-5 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md items-start gap-3 rounded-[8px] bg-rw-ink px-4 py-3 text-sm leading-5 text-white shadow-[0_12px_34px_rgba(20,33,29,0.24)] sm:bottom-8"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rw-yellow" aria-hidden="true" />
      <span className="min-w-0 flex-1">{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        title="Dismiss"
        className="-mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] text-white/70 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-rw-yellow"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
