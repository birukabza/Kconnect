import { AlertTriangle, X } from "lucide-react";

interface ToastProps {
  message: string;
  onDismiss: () => void;
}

export function Toast({ message, onDismiss }: ToastProps) {
  return (
    <div
      role="alert"
      className="fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-rw-ink px-4 py-2 text-sm text-white shadow-lg"
    >
      <AlertTriangle className="h-4 w-4 shrink-0 text-rw-yellow" aria-hidden="true" />
      <span>{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="ml-1 rounded-full p-0.5 hover:bg-white/10"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
