"use client";

import React, { useState, useEffect } from "react";
import { useThemeStore } from "@/store/themeStore";

export default function WallpaperBackground() {
  const { wallpaper } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getYouTubeEmbedUrl = (url: string) => {
    try {
      let videoId = "";
      if (url.includes("youtu.be/")) {
        videoId = url.split("youtu.be/")[1]?.split("?")[0];
      } else if (url.includes("watch?v=")) {
        videoId = url.split("watch?v=")[1]?.split("&")[0];
      } else if (url.includes("embed/")) {
        videoId = url.split("embed/")[1]?.split("?")[0];
      }
      return videoId
        ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&playsinline=1`
        : "";
    } catch {
      return "";
    }
  };

  if (!mounted) {
    return <div className="fixed inset-0 pointer-events-none -z-10 bg-black select-none" />;
  }

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none">
      {/* Background Media */}
      {wallpaper.type === "preset" || wallpaper.type === "image" ? (
        wallpaper.url ? (
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700"
            style={{
              backgroundImage: `url(${wallpaper.url})`,
              filter: `blur(${wallpaper.blurAmount}px)`,
              transform: wallpaper.blurAmount > 0 ? "scale(1.05)" : "none",
            }}
          />
        ) : null
      ) : wallpaper.type === "video" ? (
        wallpaper.url ? (
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover transition-all duration-700"
            style={{
              filter: `blur(${wallpaper.blurAmount}px)`,
              transform: wallpaper.blurAmount > 0 ? "scale(1.05)" : "none",
            }}
          >
            <source src={wallpaper.url} type="video/mp4" />
          </video>
        ) : null
      ) : wallpaper.type === "youtube" ? (
        wallpaper.url ? (
          <iframe
            src={getYouTubeEmbedUrl(wallpaper.url)}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none border-0"
            allow="autoplay; encrypted-media"
            style={{
              filter: `blur(${wallpaper.blurAmount}px)`,
              transform: "scale(1.25)",
            }}
          />
        ) : null
      ) : wallpaper.type === "gradient" ? (
        <div
          className="absolute inset-0 transition-all duration-700"
          style={{
            background: wallpaper.url || "linear-gradient(135deg, #0a0a0a 0%, #171717 100%)",
            filter: `blur(${wallpaper.blurAmount}px)`,
          }}
        />
      ) : null}

      {/* Dark Overlay Layer */}
      <div
        className="absolute inset-0 bg-black transition-opacity duration-300"
        style={{ opacity: wallpaper.overlayOpacity }}
      />
    </div>
  );
}
