"use client";

import React, { useState } from "react";
import {
  Share2,
  Copy,
  Check,
  ExternalLink,
  X,
  Sparkles,
  Flame,
  Award,
  Globe,
} from "lucide-react";
import { toast } from "sonner";

interface ShareProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    name: string;
    username: string;
    avatar?: string;
  };
  stats?: {
    totalHours?: number;
    currentStreak?: number;
    rankTitle?: string;
  };
}

export default function ShareProfileModal({
  isOpen,
  onClose,
  user,
  stats,
}: ShareProfileModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "https://focusdesk.app";
  const profileUrl = `${origin}/u/${user.username}`;
  const totalHours = stats?.totalHours ?? 0;
  const currentStreak = stats?.currentStreak ?? 0;

  const shareText = `Check out my study profile on FocusDesk! I've logged ${totalHours}h of deep work with a ${currentStreak}-day streak.`;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(profileUrl);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = profileUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      toast.success("Profile link copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${user.name} on FocusDesk`,
          text: shareText,
          url: profileUrl,
        });
      } catch (err: any) {
        if (err.name !== "AbortError") {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  const socialLinks = [
    {
      name: "WhatsApp",
      color: "hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/40",
      href: `https://api.whatsapp.com/send?text=${encodeURIComponent(
        shareText + " " + profileUrl
      )}`,
    },
    {
      name: "X (Twitter)",
      color: "hover:bg-sky-500/20 hover:text-sky-400 hover:border-sky-500/40",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        shareText
      )}&url=${encodeURIComponent(profileUrl)}`,
    },
    {
      name: "LinkedIn",
      color: "hover:bg-blue-500/20 hover:text-blue-400 hover:border-blue-500/40",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        profileUrl
      )}`,
    },
    {
      name: "Telegram",
      color: "hover:bg-cyan-500/20 hover:text-cyan-400 hover:border-cyan-500/40",
      href: `https://t.me/share/url?url=${encodeURIComponent(
        profileUrl
      )}&text=${encodeURIComponent(shareText)}`,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md p-6 rounded-3xl bg-neutral-950 border border-neutral-800 shadow-2xl text-white space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Share Scholar Profile</h3>
            <p className="text-xs text-neutral-400">
              Share your milestones, streak, and focus hours with anyone
            </p>
          </div>
        </div>

        {/* Profile Card Preview */}
        <div className="p-4 rounded-2xl bg-neutral-900/70 border border-neutral-800/80 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-full border-2 border-neutral-700 bg-neutral-800 overflow-hidden flex items-center justify-center shrink-0">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-base font-bold text-white">
                {(user.name || "U")[0].toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-white truncate">{user.name}</h4>
            <p className="text-xs font-mono text-neutral-400 truncate">@{user.username}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 font-mono">
                {totalHours}h studied
              </span>
              {currentStreak > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono flex items-center gap-1">
                  <Flame className="w-3 h-3 fill-amber-500" />
                  {currentStreak}d streak
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Copy Link Input Bar */}
        <div>
          <label className="text-xs font-semibold text-neutral-400 block mb-1.5">
            Your Public Profile Link
          </label>
          <div className="flex items-center gap-2 p-1.5 pl-3 rounded-2xl bg-neutral-900 border border-neutral-800">
            <input
              type="text"
              readOnly
              value={profileUrl}
              className="flex-1 bg-transparent text-xs text-neutral-200 outline-none truncate font-mono select-all"
            />
            <button
              onClick={handleCopy}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                copied
                  ? "bg-emerald-500 text-black shadow-md"
                  : "bg-white hover:bg-neutral-200 text-black active:scale-95"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Social Shares */}
        <div>
          <label className="text-xs font-semibold text-neutral-400 block mb-2">
            Share directly on
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {socialLinks.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`py-2 px-2.5 rounded-xl border border-neutral-800 bg-neutral-900/60 text-xs font-medium text-neutral-300 text-center transition-all ${s.color}`}
              >
                {s.name}
              </a>
            ))}
          </div>
        </div>

        {/* Native Mobile Share & Open Link Buttons */}
        <div className="pt-2 border-t border-neutral-800 flex items-center justify-between gap-2">
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
          >
            <span>Preview Profile</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
            <button
              onClick={handleNativeShare}
              className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>More Options</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

