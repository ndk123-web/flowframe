import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="w-full border-t border-[var(--border)] bg-[var(--bg-elevated)]">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8">
          {/* Brand Column */}
          <div className="md:col-span-2 flex flex-col gap-3">
            <p className="text-sm font-bold text-[color:var(--foreground)]">
              FlowFrame
            </p>
            <p className="text-sm text-[color:var(--muted)] leading-relaxed max-w-xs">
              Interactive distributed systems simulator. Build architectures visually, run REST requests through them, and observe behavior frame by frame.
            </p>
            <p className="text-xs text-[color:var(--muted)]">
              Built by{" "}
              <a
                href="https://github.com/ndk123-web"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[color:var(--accent)] hover:underline font-semibold"
              >
                ndk
              </a>
            </p>
          </div>

          {/* Product Column */}
          <div className="flex flex-col gap-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--muted)]">
              Product
            </p>
            <div className="flex flex-col gap-2 text-sm text-[color:var(--muted)]">
              <Link href="/" className="hover:text-[color:var(--foreground)] transition-colors">
                Home
              </Link>
              <Link href="/workspace" className="hover:text-[color:var(--foreground)] transition-colors">
                Workspace
              </Link>
              <Link href="/scenarios" className="hover:text-[color:var(--foreground)] transition-colors">
                Scenarios
              </Link>
              <Link href="/learn" className="hover:text-[color:var(--foreground)] transition-colors">
                Learn
              </Link>
              <Link href="/docs" className="hover:text-[color:var(--foreground)] transition-colors">
                Docs
              </Link>
            </div>
          </div>

          {/* Connect Column */}
          <div className="flex flex-col gap-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--muted)]">
              Connect
            </p>
            <div className="flex flex-col gap-2 text-sm text-[color:var(--muted)]">
              <a
                href="https://github.com/ndk123-web/flowframe"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[color:var(--foreground)] transition-colors flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                GitHub
              </a>
              <a
                href="https://www.youtube.com/watch?v=XQxFZg6RcTI"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[color:var(--red)] transition-colors flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
                YouTube
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
        <div className="border-t border-[var(--border)] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[color:var(--muted)]">
          <p>© 2026 FlowFrame. All rights reserved.</p>
          <a
            href="https://polyformproject.org/licenses/noncommercial/1.0.0/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[color:var(--foreground)] transition-colors"
          >
            PolyForm Noncommercial License 1.0.0
          </a>
        </div>
      </div>
    </footer>
  );
}
