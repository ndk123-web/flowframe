"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createUserWithEmailAndPassword, signInWithPopup, updateProfile } from "firebase/auth";
import { auth, googleProvider } from "@/config/firebase";
import SiteHeader from "@/components/SiteHeader";
import { useAuthStore } from "@/store/useAuthStore";
import { useToastStore } from "@/store/useToastStore";
import { syncFirebaseUserApi } from "@/services/authApi";

type Theme = "light" | "dark";

export default function SignUpPage() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const showToast = useToastStore((state) => state.showToast);

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

  // Handler: Firebase Auth -> Strict Backend Sync -> Zustand Store -> Redirect ONLY IF SYNC SUCCEEDS
  const handleFirebaseUserSync = async (fbUser: any, typeOfSignin: string) => {
    const userEmail = fbUser.email || "";
    const userName = name || fbUser.displayName || userEmail.split("@")[0];
    const avatar = fbUser.photoURL || "";
    const uid = fbUser.uid;

    try {
      const idToken = await fbUser.getIdToken();

      // Sync with Rust backend MongoDB
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
      // Redirect ONLY after backend sync succeeds!
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Backend DB sync error:", err);
      showToast("Backend server unreachable. Unable to sync profile with database.", "error");
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast("Please provide both email and password.", "error");
      return;
    }

    if (password.length < 6) {
      showToast("Password must be at least 6 characters.", "error");
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
      showToast(err.message || "Failed to create account.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await handleFirebaseUserSync(result.user, "google");
    } catch (err: any) {
      showToast(err.message || "Google sign up failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[color:var(--foreground)] flex flex-col justify-between transition-colors duration-300">
      <SiteHeader
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
        showHomeLink={true}
        badgeText="Firebase Authentication"
        alwaysGlass={true}
      />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md p-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-2xl shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-[color:var(--foreground)]">Create an Account</h1>
            <p className="text-xs text-[color:var(--foreground)]/60">
              Get started with FlowFrame Architecture Simulator
            </p>
          </div>

          {/* Social Sign-Up */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] hover:bg-[var(--surface)] text-sm font-semibold text-[color:var(--foreground)] transition duration-200 cursor-pointer disabled:opacity-50 shadow-sm"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
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
            <span className="relative bg-[var(--surface)] px-3 text-[10px] uppercase font-mono tracking-widest text-[color:var(--foreground)]/40">
              OR EMAIL
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleEmailSignUp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[color:var(--foreground)]/70 mb-1.5">
                Full Name (Optional)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Navnath Deshmukh"
                className="w-full px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)]/80 text-sm text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[color:var(--foreground)]/70 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)]/80 text-sm text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[color:var(--foreground)]/70 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)]/80 text-sm text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-violet-500/25 transition cursor-pointer disabled:opacity-50"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <p className="text-center text-xs text-[color:var(--foreground)]/60">
            Already have an account?{" "}
            <Link href="/signin" className="font-semibold text-violet-400 hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-[color:var(--foreground)]/40 border-t border-[var(--border)]/30">
        FlowFrame Architecture Simulator &copy; {new Date().getFullYear()} · All rights reserved.
      </footer>
    </div>
  );
}
