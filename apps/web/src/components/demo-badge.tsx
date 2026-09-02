import { cn } from "@/lib/utils";

export function DemoBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-live/30 bg-live/10 px-2 py-0.5 text-[11px] font-medium tracking-wide text-live uppercase",
        className,
      )}
    >
      Demo
    </span>
  );
}
