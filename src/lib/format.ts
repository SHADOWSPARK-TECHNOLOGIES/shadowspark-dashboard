export function formatNaira(value: number, opts?: { compact?: boolean }) {
  if (opts?.compact) {
    if (value >= 1_000_000) return `₦${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `₦${(value / 1_000).toFixed(0)}K`;
  }
  return `₦${value.toLocaleString("en-NG")}`;
}

export function relativeTime(iso: string) {
  if (!iso || iso === "—") return "—";
  const then = new Date(iso).getTime();
  const now = new Date("2026-08-05T17:58:00Z").getTime();
  const diff = Math.round((now - then) / 60000);
  const future = diff < 0;
  const mins = Math.abs(diff);
  const label =
    mins < 60
      ? `${mins} min`
      : mins < 1440
        ? `${Math.round(mins / 60)} hour${Math.round(mins / 60) === 1 ? "" : "s"}`
        : `${Math.round(mins / 1440)} day${Math.round(mins / 1440) === 1 ? "" : "s"}`;
  return future ? `in ${label}` : `${label} ago`;
}

export function formatDate(iso: string) {
  if (!iso || iso === "—") return "—";
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatTimestamp(iso: string) {
  if (!iso || iso === "—") return "—";
  return new Date(iso).toISOString().replace("T", " ").slice(0, 19);
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function hoursSince(iso: string) {
  const now = new Date("2026-08-05T17:58:00Z").getTime();
  return (now - new Date(iso).getTime()) / 3600_000;
}
