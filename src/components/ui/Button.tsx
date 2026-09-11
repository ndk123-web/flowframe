import React from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "accent";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  children?: React.ReactNode;
  asChild?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--accent)] text-white hover:bg-[var(--accent-muted)] shadow-sm hover:shadow-[0_4px_12px_-4px_var(--glow)] active:scale-[0.97]",
  secondary:
    "bg-[var(--surface)] text-[color:var(--foreground)] border border-[var(--border-strong)] hover:bg-[var(--surface-muted)] hover:border-[var(--accent)] active:scale-[0.97]",
  ghost:
    "bg-transparent text-[color:var(--foreground)]/70 hover:bg-[var(--surface)] hover:text-[color:var(--foreground)] active:scale-[0.97]",
  danger:
    "bg-[var(--red-muted)] text-[color:var(--red)] border border-[var(--red)]/25 hover:bg-[var(--red)]/20 active:scale-[0.97]",
  accent:
    "bg-[var(--accent-muted)]/10 text-[color:var(--accent)] border border-[var(--accent)]/25 hover:bg-[var(--accent)]/20 active:scale-[0.97]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-2.5 py-1.5 text-xs gap-1.5 rounded-md",
  md: "px-4 py-2 text-sm gap-2 rounded-lg",
  lg: "px-5 py-2.5 text-sm gap-2.5 rounded-lg",
};

export function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  icon,
  iconPosition = "left",
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      className={[
        "inline-flex items-center justify-center font-semibold transition-all duration-150 cursor-pointer select-none whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--bg)]",
        variantClasses[variant],
        sizeClasses[size],
        isDisabled ? "opacity-50 pointer-events-none" : "",
        className,
      ].join(" ")}
      {...props}
    >
      {loading ? (
        <svg
          className="w-3.5 h-3.5 animate-spin shrink-0"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : (
        icon && iconPosition === "left" && (
          <span className="shrink-0">{icon}</span>
        )
      )}
      {children && <span>{children}</span>}
      {!loading && icon && iconPosition === "right" && (
        <span className="shrink-0">{icon}</span>
      )}
    </button>
  );
}
