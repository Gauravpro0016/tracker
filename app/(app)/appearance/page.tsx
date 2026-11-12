"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Palette,
  Image as ImageIcon,
  Video,
  RotateCcw,
  Upload,
  Check,
  Eye,
  Sliders,
  Type,
  Maximize2,
  Sparkles,
} from "lucide-react";
import {
  useThemeStore,
  PRESET_THEMES,
  BUILT_IN_WALLPAPERS,
} from "@/store/themeStore";
import { toast } from "sonner";

export default function AppearancePage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const {
    theme,
    wallpaper,
    setTheme,
    applyPreset,
    setWallpaper,
    resetTheme,
    applyCssVariables,
  } = useThemeStore();

  const [videoUrlInput, setVideoUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);

  // Sync to database if logged in
  const syncUserAppearanceMutation = useMutation({
    mutationFn: async (payload: { theme?: any; wallpaper?: any }) => {
      if (!session?.user) return null;
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save appearance");
      }
      return res.json();
    },
    onSuccess: (data) => {
      if (data && session?.user?.email) {
        queryClient.setQueryData(["userProfile", session.user.email], data);
      }
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      toast.success("Appearance saved to profile");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save appearance");
    },
  });

  const handleApplyPreset = (key: string) => {
    applyPreset(key);
    syncUserAppearanceMutation.mutate({ theme: useThemeStore.getState().theme });
  };

  const handleThemeChange = (updates: any) => {
    setTheme(updates);
    const latestTheme = { ...useThemeStore.getState().theme, ...updates };
    syncUserAppearanceMutation.mutate({ theme: latestTheme });
  };

  const handleWallpaperChange = (updates: any) => {
    setWallpaper(updates);
    const latestWallpaper = { ...useThemeStore.getState().wallpaper, ...updates };
    syncUserAppearanceMutation.mutate({
      wallpaper: latestWallpaper,
    });
  };

  const handleReset = () => {
    resetTheme();
    syncUserAppearanceMutation.mutate({
      theme: useThemeStore.getState().theme,
      wallpaper: useThemeStore.getState().wallpaper,
    });
    toast.success("Reset to default minimal theme");
  };

  // Direct server upload with Cloudinary and persistent fallback
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isVideo = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isVideo && file.size > 50 * 1024 * 1024) {
      toast.error("Video file must be under 50MB");
      return;
    }

    setUploading(true);
    toast.loading(isVideo ? "Uploading background video..." : "Uploading wallpaper...", {
      id: "wallpaper-upload",
    });

    try {
      let finalUrl = "";

      // 1. Upload via multipart form-data to /api/upload (Cloudinary server stream)
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", isVideo ? "focusdesk/videos" : "focusdesk/wallpapers");

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (uploadRes.ok) {
          const data = await uploadRes.json();
          if (data.url) {
            finalUrl = data.url;
          }
        }
      } catch (uploadErr) {
        console.warn("Direct upload error:", uploadErr);
      }

      // 2. Fallback to base64 Data URL for images if direct Cloudinary upload failed
      if (!finalUrl && !isVideo) {
        finalUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      if (!finalUrl) {
        throw new Error("Could not process uploaded file");
      }

      handleWallpaperChange({
        type: isVideo ? "video" : "image",
        url: finalUrl,
      });

      toast.success("Wallpaper uploaded and saved!", { id: "wallpaper-upload" });
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(err.message || "Failed to upload wallpaper", { id: "wallpaper-upload" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20 animate-fade-in text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Appearance & Themes</h1>
          <p className="text-xs text-neutral-400">
            Customize typography, timer layout, ambient wallpapers, and live themes
          </p>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-xs font-semibold text-neutral-300 hover:text-white transition-colors self-start sm:self-center"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to Default</span>
        </button>
      </div>

      {/* Live Preview Box */}
      <div className="p-4 sm:p-6 md:p-8 rounded-3xl bg-neutral-950/80 border border-neutral-800 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" /> Live Preview
          </span>
          <span className="text-[10px] text-neutral-500 font-mono truncate max-w-[200px]">
            {theme.fontChoice} • {theme.digitStyle} • {theme.borderRadius}px radius
          </span>
        </div>

        <div
          className="py-8 sm:py-10 px-4 sm:px-6 rounded-2xl flex flex-col items-center justify-center transition-all select-none border"
          style={{
            backgroundColor: theme.cardColor,
            borderColor: theme.borderColor,
            borderRadius: `${theme.borderRadius}px`,
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Focus Session
            </span>
          </div>

          <div
            className="font-mono font-bold tracking-tight my-2 text-center"
            style={{
              color: theme.textColor,
              fontSize: "clamp(2.5rem, 8vw, 4.5rem)",
              lineHeight: 1,
            }}
          >
            {theme.showSeconds ? "25:00" : "25m"}
          </div>

          <div className="flex items-center gap-3 mt-4">
            <div
              className="px-5 sm:px-6 py-2 rounded-xl text-xs font-bold transition-transform shadow-md"
              style={{
                backgroundColor: theme.accentColor,
                color: theme.backgroundColor === "#ffffff" ? "#ffffff" : "#000000",
                borderRadius: `${Math.max(6, theme.borderRadius - 4)}px`,
              }}
            >
              Start Timer
            </div>
            <div
              className="px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold border transition-colors"
              style={{
                borderColor: theme.borderColor,
                color: theme.textColor,
                borderRadius: `${Math.max(6, theme.borderRadius - 4)}px`,
              }}
            >
              Settings
            </div>
          </div>
        </div>
      </div>

      {/* Theme Presets */}
      <div className="p-4 sm:p-6 rounded-3xl bg-neutral-950/70 border border-neutral-800 backdrop-blur-md shadow-xl">
        <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
          <Palette className="w-4 h-4 text-neutral-400" />
          <span>Preset Themes</span>
        </h3>
        <p className="text-xs text-neutral-400 mb-4">
          One-click aesthetic styles engineered for maximum focus
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Object.entries(PRESET_THEMES).map(([key, p]) => {
            const isSelected = theme.preset === key;
            return (
              <button
                key={key}
                onClick={() => handleApplyPreset(key)}
                className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                  isSelected
                    ? "border-white bg-neutral-900 shadow-lg scale-[1.02]"
                    : "border-neutral-800 bg-neutral-900/40 hover:border-neutral-700"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-2.5">
                  <div
                    className="w-4 h-4 rounded-full border border-neutral-700"
                    style={{ backgroundColor: p.backgroundColor }}
                  />
                  <div
                    className="w-4 h-4 rounded-full border border-neutral-700"
                    style={{ backgroundColor: p.textColor }}
                  />
                  <div
                    className="w-4 h-4 rounded-full border border-neutral-700"
                    style={{ backgroundColor: p.accentColor }}
                  />
                </div>
                <p className="text-xs font-bold text-white capitalize">{key.replace("-", " & ")}</p>
                {isSelected && (
                  <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-white" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Theme Builder */}
      <div className="p-4 sm:p-6 rounded-3xl bg-neutral-950/70 border border-neutral-800 backdrop-blur-md shadow-xl space-y-6">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-neutral-400" />
            <span>Custom Theme Builder</span>
          </h3>
          <p className="text-xs text-neutral-400">Fine-tune every visual token of FocusDesk</p>
        </div>

        {/* Color tokens */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div>
            <label className="text-xs text-neutral-400 block mb-1.5 font-medium">
              Background Color
            </label>
            <div className="flex items-center gap-2 p-2 bg-neutral-900 border border-neutral-800 rounded-xl">
              <input
                type="color"
                value={theme.backgroundColor}
                onChange={(e) => handleThemeChange({ backgroundColor: e.target.value })}
                className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
              />
              <span className="text-xs font-mono text-neutral-300 uppercase">
                {theme.backgroundColor}
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs text-neutral-400 block mb-1.5 font-medium">
              Text Color
            </label>
            <div className="flex items-center gap-2 p-2 bg-neutral-900 border border-neutral-800 rounded-xl">
              <input
                type="color"
                value={theme.textColor}
                onChange={(e) => handleThemeChange({ textColor: e.target.value })}
                className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
              />
              <span className="text-xs font-mono text-neutral-300 uppercase">
                {theme.textColor}
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs text-neutral-400 block mb-1.5 font-medium">
              Accent Color
            </label>
            <div className="flex items-center gap-2 p-2 bg-neutral-900 border border-neutral-800 rounded-xl">
              <input
                type="color"
                value={theme.accentColor}
                onChange={(e) => handleThemeChange({ accentColor: e.target.value })}
                className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
              />
              <span className="text-xs font-mono text-neutral-300 uppercase">
                {theme.accentColor}
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs text-neutral-400 block mb-1.5 font-medium">
              Border Color
            </label>
            <div className="flex items-center gap-2 p-2 bg-neutral-900 border border-neutral-800 rounded-xl">
              <input
                type="color"
                value={theme.borderColor}
                onChange={(e) => handleThemeChange({ borderColor: e.target.value })}
                className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
              />
              <span className="text-xs font-mono text-neutral-300 uppercase">
                {theme.borderColor}
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs text-neutral-400 block mb-1.5 font-medium">
              Card Surface
            </label>
            <div className="flex items-center gap-2 p-2 bg-neutral-900 border border-neutral-800 rounded-xl">
              <input
                type="color"
                value={theme.cardColor}
                onChange={(e) => handleThemeChange({ cardColor: e.target.value })}
                className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
              />
              <span className="text-xs font-mono text-neutral-300 uppercase">
                {theme.cardColor}
              </span>
            </div>
          </div>
        </div>

        {/* Sliders: Radius & Font */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-neutral-800">
          <div>
            <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
              <span>Border Radius</span>
              <span className="font-mono">{theme.borderRadius}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="24"
              value={theme.borderRadius}
              onChange={(e) => handleThemeChange({ borderRadius: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-white"
            />
          </div>

          <div>
            <label className="text-xs text-neutral-400 block mb-2 font-medium">
              Font Family
            </label>
            <select
              value={theme.fontChoice}
              onChange={(e) => handleThemeChange({ fontChoice: e.target.value })}
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-white"
            >
              <option value="Inter">Inter (Clean Sans)</option>
              <option value="Space Grotesk">Space Grotesk (Tech Modern)</option>
              <option value="JetBrains Mono">JetBrains Mono (Monospace)</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-neutral-400 block mb-2 font-medium">
              Digit Display Style
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleThemeChange({ digitStyle: "normal" })}
                className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                  theme.digitStyle === "normal"
                    ? "bg-white text-black border-white"
                    : "bg-neutral-900 border-neutral-800 text-neutral-400"
                }`}
              >
                Monospace
              </button>
              <button
                type="button"
                onClick={() => handleThemeChange({ digitStyle: "flip" })}
                className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                  theme.digitStyle === "flip"
                    ? "bg-white text-black border-white"
                    : "bg-neutral-900 border-neutral-800 text-neutral-400"
                }`}
              >
                Flip Clock
              </button>
            </div>
          </div>
        </div>

        {/* Clock toggles */}
        <div className="pt-4 border-t border-neutral-800 flex items-center gap-6 flex-wrap">
          <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
            <input
              type="checkbox"
              checked={theme.showSeconds}
              onChange={(e) => handleThemeChange({ showSeconds: e.target.checked })}
              className="w-4 h-4 rounded border-neutral-800 bg-neutral-900 accent-white cursor-pointer"
            />
            <span>Show Seconds in Timer</span>
          </label>

          <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
            <input
              type="checkbox"
              checked={theme.clockFormat === "24h"}
              onChange={(e) =>
                handleThemeChange({ clockFormat: e.target.checked ? "24h" : "12h" })
              }
              className="w-4 h-4 rounded border-neutral-800 bg-neutral-900 accent-white cursor-pointer"
            />
            <span>24-Hour Time Format</span>
          </label>
        </div>
      </div>

      {/* Wallpaper & Video Backgrounds */}
      <div className="p-4 sm:p-6 rounded-3xl bg-neutral-950/70 border border-neutral-800 backdrop-blur-md shadow-xl space-y-6">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-neutral-400" />
            <span>Study Wallpaper & Ambient Video</span>
          </h3>
          <p className="text-xs text-neutral-400">
            Choose from minimal curated backgrounds, gradient mood, or upload your own video
          </p>
        </div>

        {/* Curated Built-in Wallpapers */}
        <div>
          <label className="text-xs text-neutral-400 block mb-2 font-medium">
            Curated Minimal Wallpapers
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {BUILT_IN_WALLPAPERS.map((wp) => {
              const isSelected = wallpaper.url === wp.url || wallpaper.url === wp.id;
              return (
                <button
                  key={wp.id}
                  onClick={() => handleWallpaperChange({ type: "preset", url: wp.url })}
                  className={`h-24 rounded-2xl overflow-hidden relative group border transition-all ${
                    isSelected ? "border-white ring-2 ring-white/50" : "border-neutral-800"
                  }`}
                >
                  <img
                    src={wp.thumbnail || wp.url}
                    alt={wp.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                  <span className="absolute bottom-2 left-2 text-[10px] font-bold text-white truncate max-w-[90%] drop-shadow">
                    {wp.name}
                  </span>
                  {isSelected && (
                    <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-white text-black flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Upload Image & Video */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-neutral-800">
          {/* Upload Custom Image */}
          <div className="p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800 flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-white flex items-center gap-2 mb-1">
                <Upload className="w-3.5 h-3.5" /> Upload Image
              </span>
              <p className="text-[11px] text-neutral-400 mb-3">
                Upload your own JPG, PNG, or WEBP wallpaper.
              </p>
            </div>
            <label className="w-full py-2 px-3 rounded-xl border border-neutral-700 hover:border-neutral-500 bg-neutral-900 text-xs font-semibold text-center cursor-pointer transition-colors block">
              {uploading ? "Uploading..." : "Select Image"}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, false)}
                className="hidden"
              />
            </label>
          </div>

          {/* Upload Video or Direct URL */}
          <div className="p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800 flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-white flex items-center gap-2 mb-1">
                <Video className="w-3.5 h-3.5" /> Video / YouTube
              </span>
              <p className="text-[11px] text-neutral-400 mb-3">
                Upload MP4/WebM video (up to 50MB) or paste a direct/YouTube URL.
              </p>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Paste MP4 or YouTube URL..."
                value={videoUrlInput}
                onChange={(e) => setVideoUrlInput(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white"
              />
              <button
                type="button"
                onClick={() => {
                  if (videoUrlInput.trim()) {
                    const isYt =
                      videoUrlInput.includes("youtube.com") ||
                      videoUrlInput.includes("youtu.be");
                    handleWallpaperChange({
                      type: isYt ? "youtube" : "video",
                      url: videoUrlInput.trim(),
                    });
                    toast.success("Video background saved to profile!");
                  }
                }}
                className="px-3 py-1.5 bg-white text-black font-bold text-xs rounded-xl hover:bg-neutral-200"
              >
                Apply
              </button>
            </div>
          </div>
        </div>

        {/* Darkness & Blur Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-neutral-800">
          <div>
            <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
              <span>Darkness Overlay</span>
              <span className="font-mono">{Math.round((wallpaper.overlayOpacity ?? 0.5) * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={wallpaper.overlayOpacity ?? 0.5}
              onChange={(e) =>
                setWallpaper({ overlayOpacity: parseFloat(e.target.value) })
              }
              onPointerUp={() =>
                handleWallpaperChange({ overlayOpacity: wallpaper.overlayOpacity })
              }
              onKeyUp={() =>
                handleWallpaperChange({ overlayOpacity: wallpaper.overlayOpacity })
              }
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-white"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
              <span>Background Blur</span>
              <span className="font-mono">{wallpaper.blurAmount || 0}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              step="1"
              value={wallpaper.blurAmount || 0}
              onChange={(e) =>
                setWallpaper({ blurAmount: parseInt(e.target.value) })
              }
              onPointerUp={() =>
                handleWallpaperChange({ blurAmount: wallpaper.blurAmount })
              }
              onKeyUp={() =>
                handleWallpaperChange({ blurAmount: wallpaper.blurAmount })
              }
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

