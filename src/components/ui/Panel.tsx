import React from "react";

interface PanelProps {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  noPadding?: boolean;
}

export function Panel({ children, className = "", header, footer, noPadding }: PanelProps) {
  return (
    <div
      className={[
        "rounded-xl border border-[var(--border)] bg-[var(--surface)]",
        className,
      ].join(" ")}
    >
      {header && (
        <div className="flex items-center border-b border-[var(--border)] px-4 py-3">
          {header}
        </div>
      )}
      <div className={noPadding ? "" : "p-4"}>{children}</div>
      {footer && (
        <div className="flex items-center border-t border-[var(--border)] px-4 py-3">
          {footer}
        </div>
      )}
    </div>
  );
}

export function SectionLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={["text-[10px] font-bold uppercase tracking-widest text-[color:var(--muted)]", className].join(" ")}>
      {children}
    </p>
  );
}
