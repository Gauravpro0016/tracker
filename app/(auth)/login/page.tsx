"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { ArrowLeft, Lock, Mail, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (!res || res.error) {
        toast.error("Invalid email or password");
        setLoading(false);
      } else {
        toast.success("Welcome back!");
        window.location.href = callbackUrl || "/";
      }
    } catch (err: any) {
      console.error("Sign in error:", err);
      toast.error("Failed to sign in. Please check your credentials.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-16 sm:py-20 bg-black text-white relative overflow-y-auto">
      <Link
        href="/"
        className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-2 text-xs font-medium text-neutral-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Timer
      </Link>

      <div className="w-full max-w-sm p-5 sm:p-8 rounded-3xl bg-neutral-950/80 border border-neutral-800 backdrop-blur-xl shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-10 h-10 rounded-2xl bg-white text-black font-black flex items-center justify-center mx-auto mb-3">
            FD
          </div>
          <h1 className="text-xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Sign in to sync your study logs, streak, and themes
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-neutral-300 block mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-neutral-300">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-[11px] text-neutral-400 hover:text-white transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold text-xs transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Sign In
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-neutral-400">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-white font-medium hover:underline">
            Create one
          </Link>
        </div>

        <div className="mt-3 text-center">
          <Link
            href="/"
            className="text-[11px] text-neutral-500 hover:text-neutral-300 flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Continue in offline guest mode</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <LoginForm />
    </Suspense>
  );
}
