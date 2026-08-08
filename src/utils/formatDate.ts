export function formatDate(dateString?: string): string {
  if (!dateString) return "Just now";

  const lower = dateString.toLowerCase().trim();
  // If already formatted like "Just now", "Yesterday", "X ago", return as is
  if (
    lower.includes("ago") ||
    lower.includes("now") ||
    lower.includes("yesterday") ||
    lower.includes("today")
  ) {
    return dateString;
  }

  try {
    // Standardize MongoDB / Rust BSON datetime strings:
    // e.g. "2026-08-08 07:46:44.123 UTC" -> "2026-08-08T07:46:44.123Z"
    let cleanStr = dateString
      .trim()
      .replace(/\s+UTC$/i, "Z")
      .replace(/\s+/g, "T");

    let date = new Date(cleanStr);
    if (isNaN(date.getTime())) {
      date = new Date(dateString);
    }

    // Try numeric epoch timestamp if string is numbers
    if (isNaN(date.getTime())) {
      const num = Number(dateString);
      if (!isNaN(num)) {
        date = new Date(num);
      }
    }

    if (isNaN(date.getTime())) {
      return "Just now";
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const absDiffMs = Math.abs(diffMs);

    // If less than 1 minute (or slight clock skew), show "Just now"
    if (absDiffMs < 60 * 1000) {
      return "Just now";
    }

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes >= 1 && diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`;
    }

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours >= 1 && diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    }

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) {
      return "Yesterday";
    }
    if (diffDays > 1 && diffDays < 7) {
      return `${diffDays} days ago`;
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "Just now";
  }
}
