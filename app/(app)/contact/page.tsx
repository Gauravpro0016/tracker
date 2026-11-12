"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Mail,
  User,
  MessageSquare,
  Send,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  LifeBuoy,
  Clock,
  ArrowRight,
  Loader2,
  Bug,
  Lightbulb,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  { id: "General Inquiry", label: "General Question", icon: HelpCircle },
  { id: "Bug Report", label: "Report a Bug", icon: Bug },
  { id: "Feature Request", label: "Feature Suggestion", icon: Lightbulb },
  { id: "Account Help", label: "Account / Data Help", icon: ShieldCheck },
];

export default function ContactSupportPage() {
  const { data: session } = useSession();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("General Inquiry");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Pre-fill user data if authenticated
  useEffect(() => {
    if (session?.user) {
      if (session.user.name && !name) setName(session.user.name);
      if (session.user.email && !email) setEmail(session.user.email);
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please provide a valid email address");
      return;
    }
    if (message.trim().length < 10) {
      toast.error("Message must be at least 10 characters long");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          subject: subject.trim(),
          message: message.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit message");
      }

      setIsSuccess(true);
      toast.success("Message sent successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsSuccess(false);
    setMessage("");
    if (!session?.user) {
      setName("");
      setEmail("");
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16 animate-fade-in text-white">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-neutral-950/70 border border-neutral-800 backdrop-blur-md shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
            <LifeBuoy className="w-3.5 h-3.5 text-amber-400" />
            <span>Scholar Help Desk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Contact Support & Feedback
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-xl">
            Have questions, noticed an issue, or want to suggest a new study feature?
            Leave your name, email, and message below — we typically reply within 24–48 hours.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="px-4 py-3 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-center">
            <span className="text-xs font-bold text-emerald-400 block flex items-center justify-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Active
            </span>
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider">
              Support Status
            </span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Left Column: Form (7 cols) */}
        <div className="lg:col-span-7">
          <div className="p-6 sm:p-8 rounded-3xl bg-neutral-950/80 border border-neutral-800 shadow-xl backdrop-blur-md">
            {isSuccess ? (
              <div className="text-center py-10 space-y-4 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white">Message Delivered!</h3>
                <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto leading-relaxed">
                  Thank you for reaching out, <span className="text-white font-semibold">{name}</span>.
                  We have received your message and will send a reply to{" "}
                  <span className="text-white font-mono">{email}</span> shortly.
                </p>
                <div className="pt-4 flex justify-center gap-3">
                  <button
                    onClick={handleReset}
                    className="px-5 py-2.5 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-xs font-semibold text-white transition-colors"
                  >
                    Send Another Message
                  </button>
                  <Link
                    href="/"
                    className="px-5 py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-neutral-200 transition-colors"
                  >
                    Return to Timer
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="border-b border-neutral-800/80 pb-3">
                  <h3 className="text-base font-bold text-white">Send Us a Message</h3>
                  <p className="text-xs text-neutral-400">
                    Fill out the fields below and our team will get in touch with you.
                  </p>
                </div>

                {/* Category Pills */}
                <div>
                  <label className="text-xs font-semibold text-neutral-400 block mb-2">
                    Topic / Category
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {CATEGORIES.map((cat) => {
                      const Icon = cat.icon;
                      const isSelected = subject === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSubject(cat.id)}
                          className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center justify-center gap-1.5 transition-all ${
                            isSelected
                              ? "bg-white text-black border-white shadow-md"
                              : "bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700"
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isSelected ? "text-black" : "text-neutral-400"}`} />
                          <span className="text-[11px] font-semibold text-center leading-tight">
                            {cat.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-neutral-400 block mb-1.5 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-neutral-500" />
                      <span>Your Name</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alex Morgan"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-neutral-400 block mb-1.5 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-neutral-500" />
                      <span>Email Address</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="alex@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white transition-colors"
                    />
                  </div>
                </div>

                {/* Message Textarea */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-neutral-400 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-neutral-500" />
                      <span>Message</span>
                    </label>
                    <span className="text-[11px] text-neutral-500 font-mono">
                      {message.length} / 3000
                    </span>
                  </div>
                  <textarea
                    required
                    rows={5}
                    minLength={10}
                    maxLength={3000}
                    placeholder="Describe your question, request, or issue in detail..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white transition-colors resize-none leading-relaxed"
                  />
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Minimum 10 characters. Include any helpful details or URLs.
                  </p>
                </div>

                {/* Submit Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-white hover:bg-neutral-200 text-black font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 shadow-lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending Message...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Support Info & FAQ (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Direct Support Card */}
          <div className="p-6 rounded-3xl bg-neutral-950/70 border border-neutral-800 backdrop-blur-md space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-amber-400" />
              <span>Direct Inquiries</span>
            </h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Prefer writing directly from your mail app? Reach us anytime at our support address:
            </p>
            <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
              <span className="text-xs font-mono text-neutral-200">
                support@focusdesk.app
              </span>
              <a
                href="mailto:support@focusdesk.app"
                className="text-xs font-bold text-white hover:underline flex items-center gap-1"
              >
                <span>Email</span>
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Quick FAQ Card */}
          <div className="p-6 rounded-3xl bg-neutral-950/70 border border-neutral-800 backdrop-blur-md space-y-3.5">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-neutral-400" />
              <span>Quick Help & Answers</span>
            </h4>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-neutral-900/50 border border-neutral-800/80">
                <p className="font-semibold text-white">How does offline guest mode work?</p>
                <p className="text-neutral-400 mt-1 leading-relaxed text-[11px]">
                  All sessions and streak data are safely stored in your browser's local storage. When you create an account, they automatically sync to MongoDB Atlas.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-neutral-900/50 border border-neutral-800/80">
                <p className="font-semibold text-white">How do I share my study milestones?</p>
                <p className="text-neutral-400 mt-1 leading-relaxed text-[11px]">
                  Navigate to your Profile page and click <span className="text-white">"Share Profile"</span> to copy your personal public link (<span className="font-mono text-neutral-300">/u/yourusername</span>).
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-neutral-900/50 border border-neutral-800/80">
                <p className="font-semibold text-white">Why did my streak not reset at midnight?</p>
                <p className="text-neutral-400 mt-1 leading-relaxed text-[11px]">
                  Go to <span className="text-white">Profile</span> and make sure your Timezone (e.g. <span className="font-mono">Asia/Kolkata</span> or <span className="font-mono">America/New_York</span>) is properly saved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

