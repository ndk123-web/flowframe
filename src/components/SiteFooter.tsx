import Link from "next/link";
import { FiGithub, FiYoutube, FiLinkedin, FiMail, FiCheckCircle } from "react-icons/fi";
import { APP_VERSION } from "@/config/version";

export default function SiteFooter() {
  return (
    <footer className="w-full border-t border-[var(--border)] bg-[var(--surface)] transition-colors duration-200">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-[var(--border)]">
          {/* Brand & Mission Column */}
          <div className="md:col-span-5 flex flex-col gap-3.5">
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-bold tracking-tight text-[color:var(--foreground)]">
                FlowFrame
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-[var(--surface-muted)] text-[color:var(--muted)] border border-[var(--border)]">
                {APP_VERSION}
              </span>
            </div>
            <p className="text-xs text-[color:var(--muted)] leading-relaxed max-w-sm">
              An interactive visual distributed systems simulator. Design topologies, trace packet traversals, and observe runtime behavior step by step.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <span className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                <FiCheckCircle className="w-3 h-3 text-emerald-500" />
                <span>Simulation Engine Operational</span>
              </span>
            </div>
          </div>

          {/* Product Navigation */}
          <div className="md:col-span-3 flex flex-col gap-3">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[color:var(--muted)]">
              Architecture
            </p>
            <div className="flex flex-col gap-2 text-xs text-[color:var(--muted)]">
              <Link href="/workspace" className="hover:text-[color:var(--foreground)] transition-colors">
                Sandbox Canvas
              </Link>
              <Link href="/dashboard" className="hover:text-[color:var(--foreground)] transition-colors">
                Workspace Hub
              </Link>
              <Link href="/scenarios" className="hover:text-[color:var(--foreground)] transition-colors">
                System Scenarios
              </Link>
              <Link href="/workspace?tab=library" className="hover:text-[color:var(--foreground)] transition-colors">
                Component Library
              </Link>
            </div>
          </div>

          {/* Learn & Docs */}
          <div className="md:col-span-2 flex flex-col gap-3">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[color:var(--muted)]">
              Knowledge
            </p>
            <div className="flex flex-col gap-2 text-xs text-[color:var(--muted)]">
              <Link href="/learn" className="hover:text-[color:var(--foreground)] transition-colors">
                Learn Academy
              </Link>
              <Link href="/learn/server" className="hover:text-[color:var(--foreground)] transition-colors">
                Server Internals
              </Link>
              <Link href="/learn/glossary" className="hover:text-[color:var(--foreground)] transition-colors">
                Systems Glossary
              </Link>
              <Link href="/docs" className="hover:text-[color:var(--foreground)] transition-colors">
                Documentation
              </Link>
            </div>
          </div>

          {/* Connect Column */}
          <div className="md:col-span-2 flex flex-col gap-3">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[color:var(--muted)]">
              Connect
            </p>
            <div className="flex flex-col gap-2 text-xs text-[color:var(--muted)]">
              <a
                href="https://github.com/ndk123-web/flowframe"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[color:var(--foreground)] transition-colors flex items-center gap-1.5"
              >
                <FiGithub className="w-3.5 h-3.5" />
                <span>GitHub</span>
              </a>
              <a
                href="https://www.youtube.com/watch?v=XQxFZg6RcTI"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-red-400 transition-colors flex items-center gap-1.5"
              >
                <FiYoutube className="w-3.5 h-3.5" />
                <span>YouTube</span>
              </a>
              <a
                href="https://www.linkedin.com/in/navnath-kadam-883a57288/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[color:var(--foreground)] transition-colors flex items-center gap-1.5"
              >
                <FiLinkedin className="w-3.5 h-3.5" />
                <span>LinkedIn</span>
              </a>
              <a
                href="mailto:navnathkadam284@gmail.com"
                className="hover:text-[color:var(--foreground)] transition-colors flex items-center gap-1.5"
              >
                <FiMail className="w-3.5 h-3.5" />
                <span>Contact</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom copyright bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[color:var(--muted)]">
          <p>© {new Date().getFullYear()} FlowFrame. Built for distributed systems engineering.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <a
              href="https://polyformproject.org/licenses/noncommercial/1.0.0/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[color:var(--foreground)] transition-colors font-mono"
            >
              PolyForm Noncommercial 1.0.0
            </a>
            <span className="text-[color:var(--border)]">•</span>
            <span>Created by <strong className="text-[color:var(--foreground)] font-medium">Navnath</strong></span>
          </div>
        </div>
      </div>
    </footer>
  );
}
