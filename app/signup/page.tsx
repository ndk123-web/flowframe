"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";

type Theme = "light" | "dark";

export default function SignUpPage() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("flowframe-theme") as Theme | null;
    if (saved === "light" || saved === "dark") {
      setTheme(saved);
    } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
      setTheme("light");
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("flowframe-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) {
      alert("Please agree to the Terms of Service to continue.");
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      window.location.href = "/workspace";
    }, 800);
  };

  const handleGoogleSignUp = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      window.location.href = "/workspace";
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[color:var(--foreground)] flex flex-col justify-between transition-colors duration-300">
      <SiteHeader
        theme={theme}
        onToggleTheme={toggleTheme}
        showHomeLink={true}
        badgeText="Create Account"
        alwaysGlass={true}
      />

      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {/* Header Badge & Title */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
              <span>Get Started Free</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-[color:var(--foreground)]">
              Create Free Account
            </h1>
            <p className="text-xs sm:text-sm text-[color:var(--foreground)]/60">
              Build, compile, and simulate distributed microservices topologies in seconds.
            </p>
          </div>

          {/* Authentication Card */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 shadow-xl backdrop-blur-xl space-y-6">
            {/* Google Sign Up Button */}
            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/80 hover:bg-[var(--surface-muted)] text-sm font-semibold text-[color:var(--foreground)] py-2.5 px-4 transition hover:shadow-md cursor-pointer active:scale-[0.99] disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign up with Google</span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="w-full border-t border-[var(--border)]" />
              <span className="absolute bg-[var(--surface)] px-3 text-[11px] font-semibold text-[color:var(--foreground)]/40 uppercase tracking-wider">
                Or sign up with email
              </span>
            </div>

            {/* Email / Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[color:var(--foreground)]/80 block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Rohan Sharma"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/50 px-3.5 py-2.5 text-xs text-[color:var(--foreground)] outline-none focus:border-violet-500 transition"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[color:var(--foreground)]/80 block mb-1">
                  Work Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/50 px-3.5 py-2.5 text-xs text-[color:var(--foreground)] outline-none focus:border-violet-500 transition font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[color:var(--foreground)]/80 block mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/50 px-3.5 py-2.5 text-xs text-[color:var(--foreground)] outline-none focus:border-violet-500 transition font-mono pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-[color:var(--foreground)]/50 hover:text-[color:var(--foreground)] transition cursor-pointer text-xs"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* Agree Terms */}
              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="accent-violet-500 rounded mt-0.5 cursor-pointer"
                />
                <label htmlFor="agreeTerms" className="text-xs text-[color:var(--foreground)]/70 leading-normal cursor-pointer">
                  I agree to the{" "}
                  <a href="#terms" className="text-violet-400 font-semibold hover:underline">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#privacy" className="text-violet-400 font-semibold hover:underline">
                    Privacy Policy
                  </a>
                  .
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold py-2.5 px-4 text-xs transition shadow-lg hover:shadow-violet-500/25 active:scale-[0.99] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? (
                  <span className="inline-block animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                ) : (
                  <span>Create Account →</span>
                )}
              </button>
            </form>
          </div>

          {/* Toggle link to Sign In */}
          <div className="text-center text-xs text-[color:var(--foreground)]/60">
            Already have an account?{" "}
            <Link
              href="/signin"
              className="font-bold text-violet-400 hover:text-violet-300 transition"
            >
              Sign in
            </Link>
          </div>
        </div>
      </main>

      {/* Subtle Footer */}
      <footer className="py-6 text-center text-xs text-[color:var(--foreground)]/40 border-t border-[var(--border)]/30">
        FlowFrame Architecture Simulator &copy; {new Date().getFullYear()} · All rights reserved.
      </footer>
    </div>
  );
}
