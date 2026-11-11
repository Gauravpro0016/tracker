"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { ArrowLeft, Lock, Mail, User as UserIcon, AtSign, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !username || !email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          username: username.trim().toLowerCase(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      toast.success("Account created successfully!");

      // Automatically sign in
      const loginRes = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (!loginRes || loginRes.error) {
        window.location.href = "/login";
      } else {
        window.location.href = "/";
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center p-4">
      {/* Back to timer link */}
      <Link
        href="/"
        className="absolute top-8 left-8 flex items-center gap-2 text-xs text-neutral-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Timer
      </Link>

      <div className="w-full max-w-sm bg-neutral-950 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-white text-black font-extrabold flex items-center justify-center text-xl mb-3">
            FD
          </div>
          <h1 className="text-xl font-bold tracking-tight">Create your account</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Start tracking your deep work and build daily streaks
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-xs text-neutral-400 block mb-1 font-medium">
              Full Name
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Turing"
                className="w-full pl-10 pr-3 py-2.5 bg-neutral-900 border border-neutral-800 focus:border-white rounded-xl text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-neutral-400 block mb-1 font-medium">
              Username
            </label>
            <div className="relative">
              <AtSign className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="alexturing"
                className="w-full pl-10 pr-3 py-2.5 bg-neutral-900 border border-neutral-800 focus:border-white rounded-xl text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-neutral-400 block mb-1 font-medium">
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
                className="w-full pl-10 pr-3 py-2.5 bg-neutral-900 border border-neutral-800 focus:border-white rounded-xl text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-neutral-400 block mb-1 font-medium">
              Password (min. 6 chars)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3 py-2.5 bg-neutral-900 border border-neutral-800 focus:border-white rounded-xl text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-white text-black font-bold text-xs sm:text-sm rounded-xl hover:bg-neutral-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Create Account</span>
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-neutral-800 text-center text-xs text-neutral-400">
          <span>Already have an account? </span>
          <Link
            href="/login"
            className="text-white font-semibold underline underline-offset-4 hover:text-neutral-200"
          >
            Sign In
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

