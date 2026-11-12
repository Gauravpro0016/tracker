"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  User as UserIcon,
  Mail,
  Camera,
  Lock,
  Flame,
  Award,
  Clock,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Globe,
  GraduationCap,
  Loader2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { formatTime } from "@/lib/utils";
import { getStorageItem } from "@/lib/storage";
import { calculateStreaks } from "@/lib/streak";

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [localAvatarPreview, setLocalAvatarPreview] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [timezone, setTimezone] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [targetExam, setTargetExam] = useState("");

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Delete account confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");

  // Query User Profile
  const { data: user, isLoading } = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      if (!session?.user) return null;
      const res = await fetch("/api/user");
      if (!res.ok) throw new Error("Failed to load user profile");
      const data = await res.json();
      setName(data.name || "");
      setBio(data.bio || "");
      setTimezone(data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
      setEducationLevel(data.educationLevel || "");
      setTargetExam(data.targetExam || "");
      return data;
    },
    enabled: !!session?.user,
  });

  // Query User Stats
  const { data: analytics } = useQuery({
    queryKey: ["analytics", "year", session?.user?.email || "guest"],
    queryFn: async () => {
      if (!session?.user) {
        const local = getStorageItem<any[]>("focusdesk-guest-sessions", []);
        const streakInfo = calculateStreaks(local);
        const totalSecs = local.reduce((sum: number, s: any) => sum + (s.durationSeconds || 0), 0);
        return {
          streak: streakInfo,
          stats: { totalHours: Number((totalSecs / 3600).toFixed(1)) },
        };
      }
      const res = await fetch("/api/analytics?range=year");
      if (!res.ok) return null;
      return res.json();
    },
  });

  // Profile Update Mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      toast.success("Profile updated successfully!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save profile");
    },
  });

  // Change Password Mutation
  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to change password");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update password");
    },
  });

  // Delete Account Mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/user", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete account");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Account deleted");
      signOut({ callbackUrl: "/" });
    },
  });

  // Avatar Upload Handler
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPG, WebP)");
      return;
    }

    // Instant local preview
    const localUrl = URL.createObjectURL(file);
    setLocalAvatarPreview(localUrl);
    setIsUploadingAvatar(true);
    toast.loading("Uploading profile picture...", { id: "avatar-upload" });

    try {
      // 1. Client-side canvas resize for ultra-fast upload & lightweight fallback
      const compressedBlob = await new Promise<Blob>((resolve) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        img.onload = () => {
          URL.revokeObjectURL(objectUrl);
          const maxDim = 400;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob(
              (blob) => resolve(blob || file),
              "image/jpeg",
              0.88
            );
          } else {
            resolve(file);
          }
        };
        img.onerror = () => resolve(file);
        img.src = objectUrl;
      });

      let finalAvatarUrl = "";

      // 2. Try direct server upload to /api/upload (handles Cloudinary securely)
      try {
        const formData = new FormData();
        formData.append("file", compressedBlob, "avatar.jpg");
        formData.append("folder", "focusdesk/avatars");

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (uploadRes.ok) {
          const data = await uploadRes.json();
          if (data.url) {
            finalAvatarUrl = data.url;
          }
        }
      } catch (uploadErr) {
        console.warn("Direct upload error, falling back:", uploadErr);
      }

      // 3. Fallback to base64 Data URL if Cloudinary upload failed
      if (!finalAvatarUrl) {
        finalAvatarUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(compressedBlob);
        });
      }

      // 4. Save avatar in MongoDB
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: finalAvatarUrl }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to save avatar to profile");
      }

      // 5. Update NextAuth session
      if (updateSession) {
        await updateSession({ image: finalAvatarUrl });
      }

      // 6. Update local query cache immediately & invalidate
      queryClient.setQueryData(["userProfile"], (prev: any) => ({
        ...prev,
        avatar: finalAvatarUrl,
      }));
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });

      toast.success("Profile picture updated!", { id: "avatar-upload" });
    } catch (err: any) {
      console.error("Avatar upload failed:", err);
      toast.error(err.message || "Failed to update profile picture", { id: "avatar-upload" });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      name,
      bio,
      timezone,
      educationLevel,
      targetExam,
    });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;
    changePasswordMutation.mutate();
  };

  if (!session?.user) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4 text-white">
        <div className="w-16 h-16 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
          <UserIcon className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold">You are in Guest Mode</h2>
        <p className="text-xs text-neutral-400 max-w-sm mx-auto">
          Sign up or log in to customize your profile, set target exams, and track cloud-synced study stats!
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Link
            href="/login"
            className="px-5 py-2.5 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-xs font-semibold text-white"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-5 py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-neutral-200"
          >
            Create Account
          </Link>
        </div>
      </div>
    );
  }

  const totalHours = analytics?.stats?.totalHours || 0;
  const currentStreak = analytics?.streak?.currentStreak || 0;
  const displayedAvatar =
    localAvatarPreview || user?.avatar || (session.user as any)?.image;

  // Determine study rank badge based on total hours
  const rank =
    totalHours >= 200
      ? { title: "Grandmaster Scholar", level: 5, color: "text-amber-400" }
      : totalHours >= 100
      ? { title: "Deep Work Virtuoso", level: 4, color: "text-purple-400" }
      : totalHours >= 50
      ? { title: "Dedicated Scholar", level: 3, color: "text-sky-400" }
      : totalHours >= 20
      ? { title: "Consistent Learner", level: 2, color: "text-emerald-400" }
      : { title: "Focused Initiate", level: 1, color: "text-neutral-400" };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20 animate-fade-in text-white">
      {/* Profile Header with Avatar & Rank */}
      <div className="p-4 sm:p-6 md:p-8 rounded-3xl bg-neutral-950/70 border border-neutral-800 backdrop-blur-md shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar with upload hover & camera badge */}
          <div className="relative group w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-neutral-700 bg-neutral-900 flex items-center justify-center shrink-0 overflow-hidden shadow-lg">
            {displayedAvatar ? (
              <img
                src={displayedAvatar}
                alt={user?.name || session.user.name || "User"}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl sm:text-3xl font-black text-white">
                {(user?.name || session.user.name || "U")[0].toUpperCase()}
              </span>
            )}

            {/* Hover overlay / Uploading state */}
            <label
              htmlFor="avatar-file-input"
              className={`absolute inset-0 bg-black/60 flex flex-col items-center justify-center cursor-pointer transition-opacity ${
                isUploadingAvatar ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}
              title="Change profile picture"
            >
              {isUploadingAvatar ? (
                <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 text-white animate-spin" />
              ) : (
                <>
                  <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  <span className="text-[9px] text-neutral-300 font-medium mt-1">Change</span>
                </>
              )}
            </label>
            <input
              id="avatar-file-input"
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              disabled={isUploadingAvatar}
              className="hidden"
            />
          </div>

          <div className="text-center sm:text-left flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-white">
                {user?.name || session.user.name}
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 font-mono">
                @{user?.username || (session.user as any).username || "student"}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1 max-w-md">
              {user?.bio || "Dedicated focus desk scholar."}
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3">
              <div className="flex items-center gap-1.5">
                <Award className={`w-4 h-4 ${rank.color}`} />
                <span className={`text-xs font-bold ${rank.color}`}>
                  Rank {rank.level}: {rank.title}
                </span>
              </div>
              <label
                htmlFor="avatar-file-input"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 hover:border-neutral-700 text-[11px] font-medium text-neutral-300 cursor-pointer transition-colors"
              >
                <Upload className="w-3 h-3 text-neutral-400" />
                <span>Upload New Picture</span>
              </label>
            </div>
          </div>
        </div>

        {/* Public Stats Summary */}
        <div className="flex items-center justify-around sm:justify-start gap-4 border-t md:border-t-0 md:border-l border-neutral-800 pt-4 md:pt-0 md:pl-6 w-full md:w-auto">
          <div className="text-center px-3">
            <span className="text-xl font-bold font-mono text-white block">
              {totalHours}h
            </span>
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider">
              Total Focus
            </span>
          </div>
          <div className="text-center px-3">
            <span className="text-xl font-bold font-mono text-amber-400 block flex items-center justify-center gap-1">
              <Flame className="w-4 h-4 fill-amber-500" />
              {currentStreak}d
            </span>
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider">
              Streak
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
        <button
          onClick={() => setActiveTab("profile")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "profile"
              ? "bg-white text-black"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          General Profile
        </button>
        <button
          onClick={() => setActiveTab("security")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "security"
              ? "bg-white text-black"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          Password & Security
        </button>
      </div>

      {/* Tab 1: Profile Form */}
      {activeTab === "profile" && (
        <form
          onSubmit={handleProfileSubmit}
          className="p-6 rounded-3xl bg-neutral-950/70 border border-neutral-800 backdrop-blur-md shadow-xl space-y-4 max-w-2xl"
        >
          <div>
            <label className="text-xs text-neutral-400 block mb-1 font-medium">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-white"
            />
          </div>

          <div>
            <label className="text-xs text-neutral-400 block mb-1 font-medium">Bio</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A few words about your studies, major, or goals..."
              className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-white placeholder-neutral-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-neutral-400 block mb-1 font-medium">
                Timezone (for streak reset)
              </label>
              <input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="e.g. Asia/Kolkata or UTC"
                className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-white"
              />
            </div>

            <div>
              <label className="text-xs text-neutral-400 block mb-1 font-medium">
                Education / University
              </label>
              <input
                type="text"
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
                placeholder="e.g. Computer Science B.S."
                className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-neutral-400 block mb-1 font-medium">
              Target Exam / Certification
            </label>
            <input
              type="text"
              value={targetExam}
              onChange={(e) => setTargetExam(e.target.value)}
              placeholder="e.g. GRE, USMLE, CFA Level 1, Finals"
              className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-white"
            />
          </div>

          <div className="pt-3 border-t border-neutral-800 flex justify-end">
            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="px-6 py-2.5 bg-white text-black font-bold text-xs rounded-xl hover:bg-neutral-200 transition-colors shadow"
            >
              Save Profile
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Security & Password */}
      {activeTab === "security" && (
        <div className="space-y-6 max-w-2xl">
          <form
            onSubmit={handleChangePassword}
            className="p-6 rounded-3xl bg-neutral-950/70 border border-neutral-800 backdrop-blur-md shadow-xl space-y-4"
          >
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-neutral-400" />
              <span>Change Password</span>
            </h3>

            <div>
              <label className="text-xs text-neutral-400 block mb-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-white"
              />
            </div>

            <div>
              <label className="text-xs text-neutral-400 block mb-1">New Password (min 6 chars)</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-white"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={changePasswordMutation.isPending}
                className="px-5 py-2 bg-white text-black font-bold text-xs rounded-xl hover:bg-neutral-200 transition-colors"
              >
                Update Password
              </button>
            </div>
          </form>

          {/* Delete Account Danger Zone */}
          <div className="p-6 rounded-3xl bg-rose-950/20 border border-rose-900/30 backdrop-blur-md">
            <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4" />
              <span>Delete Account</span>
            </h3>
            <p className="text-xs text-neutral-400 mb-4">
              Permanently delete your account and all study sessions, streaks, tasks, and notes. This cannot be undone.
            </p>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition-colors"
              >
                Delete My Account
              </button>
            ) : (
              <div className="space-y-3 p-4 rounded-2xl bg-neutral-950 border border-rose-900/50">
                <p className="text-xs text-neutral-300">
                  Type <span className="font-mono font-bold text-rose-400">DELETE</span> to confirm:
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={deleteInput}
                    onChange={(e) => setDeleteInput(e.target.value)}
                    placeholder="Type DELETE"
                    className="flex-1 px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                  />
                  <div className="flex gap-2">
                    <button
                      disabled={deleteInput !== "DELETE" || deleteAccountMutation.isPending}
                      onClick={() => deleteAccountMutation.mutate()}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl disabled:opacity-40 shrink-0"
                    >
                      Confirm Delete
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3 py-2 text-xs text-neutral-400 hover:text-white shrink-0"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

