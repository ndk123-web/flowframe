"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createUserWithEmailAndPassword, signInWithPopup, updateProfile } from "firebase/auth";
import { auth, googleProvider } from "@/config/firebase";
import SiteHeader from "@/components/SiteHeader";
import { useAuthStore } from "@/store/useAuthStore";
import { useToastStore } from "@/store/useToastStore";
import { useThemeStore } from "@/store/useThemeStore";
import { syncFirebaseUserApi } from "@/services/authApi";
import {
  FiUser,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiShield,
  FiAlertCircle,
} from "react-icons/fi";

export default function SignUpPage() {
  const { theme, toggleTheme } = useThemeStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const showToast = useToastStore((state) => state.showToast);

  // Handler: Firebase Auth -> Strict Backend Sync -> Zustand Store -> Redirect ONLY IF SYNC SUCCEEDS
  const handleFirebaseUserSync = async (fbUser: any, typeOfSignin: string) => {
    const userEmail = fbUser.email || "";
    const userName = name || fbUser.displayName || userEmail.split("@")[0];
    const avatar = fbUser.photoURL || "";
    const uid = fbUser.uid;

    try {
      const idToken = await fbUser.getIdToken();

      // Sync with backend API
      const res = await syncFirebaseUserApi({
        email: userEmail,
        firebase_uid: uid,
        type_of_signin: typeOfSignin,
        name: userName,
        avatar,
        id_token: idToken,
      });

      setAuth(res.access_token, res.user);
      showToast("Account created successfully!", "success");
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Backend DB sync error:", err);
      const msg = "Backend server unreachable. Unable to sync profile.";
      setFormError(msg);
      showToast(msg, "error");
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!email || !password) {
      setFormError("Please provide both email and password.");
      return;
    }

    if (password.length < 6) {
      setFormError("Password must contain at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (name) {
        await updateProfile(userCredential.user, { displayName: name });
      }
      await handleFirebaseUserSync(userCredential.user, "email");
    } catch (err: any) {
      const msg = err.message || "Failed to create account. Please check your details.";
      setFormError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setFormError(null);
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await handleFirebaseUserSync(result.user, "google");
    } catch (err: any) {
      const msg = err.message || "Google sign up was cancelled or failed.";
      setFormError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[color:var(--foreground)] flex flex-col justify-between transition-colors duration-200 relative overflow-hidden">
      {/* Background technical subtle grid */}
      <div className="pointer-events-none absolute inset-0 -z-10 technical-grid opacity-25" />

      <SiteHeader
        theme={theme}
        onToggleTheme={toggleTheme}
        showHomeLink={true}
        badgeText="Developer Portal"
      />

      <main className="flex-1 flex items-center justify-center px-4 py-12 z-10">
        <div className="w-full max-w-md rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)]/95 backdrop-blur-md p-7 sm:p-8 shadow-2xl space-y-6">
          {/* Header */}
          <div className="space-y-2 text-center">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-[var(--surface-muted)] text-[color:var(--accent)] border border-[var(--border)]">
              <FiShield className="w-3 h-3" />
              <span>Registration</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[color:var(--foreground)]">
              Create an Account
            </h1>
            <p className="text-xs text-[color:var(--muted)] leading-relaxed">
              Join FlowFrame to design, analyze, and simulate complex distributed architectures.
            </p>
          </div>

          {/* Form Error Banner */}
          {formError && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs animate-in fade-in duration-150">
              <FiAlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="flex-1 leading-tight">{formError}</span>
            </div>
          )}

          {/* Social Sign-Up */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] hover:bg-[var(--surface-muted)] text-xs font-semibold text-[color:var(--foreground)] transition duration-150 cursor-pointer disabled:opacity-50 shadow-xs"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
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
            Sign up with Google
          </button>

          <div className="relative flex items-center justify-center">
            <span className="absolute inset-x-0 h-px bg-[var(--border)]" />
            <span className="relative bg-[var(--surface)] px-3 text-[10px] uppercase font-mono tracking-widest text-[color:var(--muted)]">
              Or register with email
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleEmailSignUp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[color:var(--foreground)] mb-1.5">
                Full Name <span className="text-[color:var(--muted)] font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <FiUser className="w-4 h-4 text-[color:var(--muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Developer"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[var(--border-strong)] bg-[var(--bg)] text-xs text-[color:var(--foreground)] placeholder:text-[color:var(--muted)]/60 focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[color:var(--foreground)] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <FiMail className="w-4 h-4 text-[color:var(--muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="developer@company.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[var(--border-strong)] bg-[var(--bg)] text-xs text-[color:var(--foreground)] placeholder:text-[color:var(--muted)]/60 focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[color:var(--foreground)]">
                  Password
                </label>
                <span className="text-[10px] text-[color:var(--muted)]">Min 6 characters</span>
              </div>
              <div className="relative">
                <FiLock className="w-4 h-4 text-[color:var(--muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a secure password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[var(--border-strong)] bg-[var(--bg)] text-xs text-[color:var(--foreground)] placeholder:text-[color:var(--muted)]/60 focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--muted)] hover:text-[color:var(--foreground)] p-1 rounded transition cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FiEyeOff className="w-3.5 h-3.5" /> : <FiEye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 px-4 rounded-xl text-white font-semibold text-xs shadow-sm cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2 transition"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <FiArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-[color:var(--muted)]">
            Already have an account?{" "}
            <Link href="/signin" className="font-semibold text-[color:var(--accent)] hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-[color:var(--muted)] border-t border-[var(--border)]">
        FlowFrame Architecture Simulator &copy; {new Date().getFullYear()} · Licensed under PolyForm Noncommercial 1.0.0
      </footer>
    </div>
  );
}
