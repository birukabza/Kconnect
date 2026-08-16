import clsx from "clsx";

export function BrandMark({
  compact = false,
  inverse = false,
}: {
  compact?: boolean;
  inverse?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5" aria-label="KConnect">
      <span
        className={clsx(
          "relative block h-8 w-7 shrink-0 overflow-hidden",
          inverse ? "text-white" : "text-rw-green"
        )}
        aria-hidden="true"
      >
        <span className="absolute left-0 top-0 h-full w-2 bg-current" />
        <span className="absolute left-2 top-0 h-4 w-5 origin-bottom-left -skew-x-[38deg] bg-rw-blue" />
        <span className="absolute bottom-0 left-2 h-4 w-5 origin-top-left skew-x-[38deg] bg-current" />
        <span className="absolute bottom-0 right-0 h-1.5 w-1.5 bg-rw-yellow" />
      </span>

      {!compact && (
        <span
          className={clsx(
            "text-xl font-bold",
            inverse ? "text-white" : "text-rw-green"
          )}
        >
          KConnect
        </span>
      )}
    </div>
  );
}
