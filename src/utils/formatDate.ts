export function formatDate(dateString?: string): string {
  if (!dateString) return "Recently";

  try {
    // Parse Rust BSON datetime format: "2026-08-08 8:53:08.464 +00:00:00"
    // Extract each component individually — no fragile string replacements
    const match = dateString.trim().match(
      /^(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}):(\d{2}):(\d{2})(?:\.(\d+))?\s*(?:[+-]\d{2}:\d{2}(?::\d{2})?|UTC)?$/
    );

    let date: Date;

    if (match) {
      const [, year, month, day, hour, minute, second, ms] = match;
      // Build a clean ISO string with zero-padded hour
      const msNorm = (ms || "0").substring(0, 3).padEnd(3, "0");
      const iso = `${year}-${month}-${day}T${hour.padStart(2, "0")}:${minute}:${second}.${msNorm}Z`;
      date = new Date(iso);
    } else {
      date = new Date(dateString);
    }

    if (isNaN(date.getTime())) {
      return "Recently";
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    if (diffMs < 60_000 && diffMs > -60_000) return "Just now";

    const mins = Math.floor(diffMs / 60_000);
    if (mins >= 1 && mins < 60) return `${mins} min${mins > 1 ? "s" : ""} ago`;

    const hours = Math.floor(diffMs / 3_600_000);
    if (hours >= 1 && hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;

    const days = Math.floor(hours / 24);
    if (days === 1) return "Yesterday";
    if (days > 1 && days < 7) return `${days} days ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "Recently";
  }
}
