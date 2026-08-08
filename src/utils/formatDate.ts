export function formatDate(dateString?: string): string {
  if (!dateString) return "Recently";

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
    // e.g. "2026-08-08 8:53:08.464 +00:00:00" -> "2026-08-08T08:53:08.464Z"
    let cleanStr = dateString.trim();

    // Remove +00:00:00 or UTC timezone indicator and standardize to Z
    cleanStr = cleanStr
      .replace(/\+00:00:00$/i, "Z")
      .replace(/\+00:00$/i, "Z")
      .replace(/\s+UTC$/i, "Z");

    // Replace first space between YYYY-MM-DD and HH:MM:SS with T
    cleanStr = cleanStr.replace(/^(\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2}:\d{2})/, "$1T$2");

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
      return "Recently";
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    // If date is in very recent past or slight clock skew (< 1 min), show "Just now"
    if (diffMs < 60 * 1000 && diffMs > -60 * 1000) {
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
    return "Recently";
  }
}
