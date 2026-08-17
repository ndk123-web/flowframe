import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="mx-auto mt-16 w-full max-w-6xl border-t border-[var(--border)] px-6 py-10 text-sm text-[color:var(--foreground)]/70">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8">
        {/* Brand Column */}
        <div className="flex flex-col gap-2">
          <p className="font-bold text-lg tracking-wide text-[color:var(--foreground)]">
            FlowFrame
          </p>
          <p className="text-xs text-[color:var(--foreground)]/50 leading-relaxed max-w-xs">
            Interactive distributed system simulator. Visualize requests, load balancers, caching, and APIs in real-time.
          </p>
          <p className="text-xs mt-2 text-[color:var(--foreground)]/60">
            Built by{" "}
            <a
              href="https://github.com/ndk123-web"
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-400 hover:text-violet-300 transition-colors font-semibold"
            >
              ndk
            </a>
          </p>
        </div>

        {/* Explore Links Column */}
        <div className="flex flex-col gap-3">
          <p className="font-semibold text-xs uppercase tracking-wider text-[color:var(--foreground)]/45">
            Explore
          </p>
          <div className="flex flex-col gap-2">
            <Link href="/" className="hover:text-[color:var(--foreground)] transition-colors">
              Home
            </Link>
            <Link href="/scenarios" className="hover:text-[color:var(--foreground)] transition-colors">
              Scenarios
            </Link>
            <Link href="/workspace" className="hover:text-[color:var(--foreground)] transition-colors">
              Sandbox Canvas
            </Link>
            <Link href="/learn" className="hover:text-[color:var(--foreground)] transition-colors">
              Learn Docs
            </Link>
          </div>
        </div>

        {/* Connect Column */}
        <div className="flex flex-col gap-3">
          <p className="font-semibold text-xs uppercase tracking-wider text-[color:var(--foreground)]/45">
            Connect & Media
          </p>
          <div className="flex flex-col gap-2">
            <a
              href="https://github.com/ndk123-web/flowframe"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[color:var(--foreground)] transition-colors flex items-center gap-1.5"
            >
              <span>GitHub Repository</span>
              <span className="text-[10px] text-violet-400 font-mono">v2.0</span>
            </a>
            <a
              href="https://www.youtube.com/watch?v=XQxFZg6RcTI"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-rose-400 transition-colors flex items-center gap-1.5 text-rose-400/90"
            >
              <span>▶ YouTube (Event-Driven Video)</span>
            </a>
            <a
              href="https://www.linkedin.com/in/navnath-kadam-883a57288/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[color:var(--foreground)] transition-colors"
            >
              LinkedIn
            </a>
            <a
              href="mailto:navnathkadam284@gmail.com"
              className="hover:text-[color:var(--foreground)] transition-colors"
            >
              Gmail
            </a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[var(--border)] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[color:var(--foreground)]/50">
        <p>© 2026 FlowFrame. All rights reserved.</p>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[var(--border)] bg-[var(--surface-muted)] text-[11px] font-mono text-[color:var(--foreground)]/70">
            <span>License:</span>
            <a
              href="https://polyformproject.org/licenses/noncommercial/1.0.0/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-400 hover:underline font-semibold"
            >
              PolyForm Noncommercial 1.0.0
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
