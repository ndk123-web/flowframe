export function formatDate(dateString?: string): string {
  if (!dateString) return "Recently";

  // If already relative like "Just now", "Yesterday", return as is
  if (
    dateString.toLowerCase().includes("ago") ||
    dateString.toLowerCase().includes("now") ||
    dateString.toLowerCase().includes("yesterday") ||
    dateString.toLowerCase().includes("today")
  ) {
    return dateString;
  }

  try {
    // Standardize MongoDB / Rust BSON datetime strings like "2026-08-08 07:46:44 UTC" -> "2026-08-08T07:46:44Z"
    let cleanStr = dateString
      .replace(" UTC", "Z")
      .replace(" ", "T");

    const date = new Date(cleanStr);
    if (isNaN(date.getTime())) {
      // Fallback: try direct parse
      const fallbackDate = new Date(dateString);
      if (isNaN(fallbackDate.getTime())) return "Recently";
      return fallbackDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch (err) {
    return "Recently";
  }
}
