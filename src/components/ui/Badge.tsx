import React from "react";

type BadgeVariant = "default" | "success" | "warning" | "error" | "info" | "accent";
type BadgeSize = "xs" | "sm" | "md";

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default:  "bg-[var(--surface-muted)] text-[color:var(--muted)] border border-[var(--border)]",
  success:  "bg-[var(--green-muted)] text-[color:var(--green)] border border-[var(--green)]/25",
  warning:  "bg-[var(--amber-muted)] text-[color:var(--amber)] border border-[var(--amber)]/25",
  error:    "bg-[var(--red-muted)] text-[color:var(--red)] border border-[var(--red)]/25",
  info:     "bg-[var(--accent)]/10 text-[color:var(--accent)] border border-[var(--accent)]/25",
  accent:   "bg-[var(--violet-muted)] text-[color:var(--violet)] border border-[var(--violet)]/20",
};

const dotColors: Record<BadgeVariant, string> = {
  default: "bg-[var(--muted)]",
  success: "bg-[var(--green)]",
  warning: "bg-[var(--amber)]",
  error:   "bg-[var(--red)]",
  info:    "bg-[var(--accent)]",
  accent:  "bg-[var(--violet)]",
};

const sizeClasses: Record<BadgeSize, string> = {
  xs: "px-1.5 py-0.5 text-[10px] rounded-md gap-1",
  sm: "px-2 py-0.5 text-xs rounded-md gap-1.5",
  md: "px-2.5 py-1 text-xs rounded-lg gap-1.5",
};

export function Badge({
  variant = "default",
  size = "sm",
  dot = false,
  children,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center font-semibold leading-none tracking-tight",
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(" ")}
    >
      {dot && (
        <span
          className={`shrink-0 rounded-full ${dotColors[variant]}`}
          style={{ width: 5, height: 5 }}
        />
      )}
      {children}
    </span>
  );
}
