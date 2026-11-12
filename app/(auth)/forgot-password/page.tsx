"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Loader2, CheckCircle2, ArrowRight, KeyRound } from "lucide-react";
import { toast } from "sonner";

function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resetUrl, setResetUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to process request");
      }

      setSubmitted(true);
      if (data.resetUrl) {
        setResetUrl(data.resetUrl);
      }
      toast.success("Password reset instructions generated!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-16 sm:py-20 bg-black text-white relative overflow-y-auto">
      <Link
        href="/login"
        className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-2 text-xs font-medium text-neutral-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Sign In
      </Link>

      <div className="w-full max-w-sm p-5 sm:p-8 rounded-3xl bg-neutral-950/80 border border-neutral-800 backdrop-blur-xl shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-10 h-10 rounded-2xl bg-neutral-900 border border-neutral-800 text-white flex items-center justify-center mx-auto mb-3">
            <KeyRound className="w-5 h-5 text-neutral-300" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Forgot password?</h1>
          <p className="text-xs text-neutral-400 mt-1">
            No worries! Enter your email and we&apos;ll help you reset your password.
          </p>
        </div>

        {!submitted ? (
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold text-xs transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Send Reset Instructions
            </button>
          </form>
        ) : (
          <div className="space-y-4 text-center">
            <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 text-left">
              <div className="flex items-center gap-2 text-xs font-semibold text-white mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Reset link ready</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Instructions have been prepared for <strong className="text-neutral-200">{email}</strong>.
              </p>
            </div>

            {resetUrl && (
              <div className="pt-1">
                <Link
                  href={resetUrl}
                  className="w-full py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg"
                >
                  <span>Reset Password Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <p className="text-[10px] text-neutral-500 mt-2">
                  (Click above to set your new password)
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setResetUrl(null);
              }}
              className="text-xs text-neutral-400 hover:text-white transition-colors"
            >
              Try another email
            </button>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-neutral-900 text-center text-xs text-neutral-400">
          Remember your password?{" "}
          <Link href="/login" className="text-white font-medium hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <ForgotPasswordForm />
    </Suspense>
  );
}

