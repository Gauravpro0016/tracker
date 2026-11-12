import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ThemeConfig {
  preset: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  borderColor: string;
  cardColor: string;
  fontChoice: string;
  timerFontSize: string; // e.g. "7rem"
  borderRadius: number; // e.g. 12
  showSeconds: boolean;
  clockFormat: "12h" | "24h";
  digitStyle: "normal" | "flip";
}

export interface WallpaperConfig {
  type: "color" | "gradient" | "preset" | "image" | "video" | "youtube";
  url: string;
  overlayOpacity: number; // 0.0 to 1.0
  blurAmount: number; // 0 to 20 px
}

export const PRESET_THEMES: Record<string, Partial<ThemeConfig>> = {
  "black-white": {
    preset: "black-white",
    backgroundColor: "#000000",
    textColor: "#ffffff",
    accentColor: "#ffffff",
    borderColor: "#262626",
    cardColor: "#0a0a0a",
    fontChoice: "Inter",
    timerFontSize: "7rem",
    borderRadius: 12,
  },
  midnight: {
    preset: "midnight",
    backgroundColor: "#090d16",
    textColor: "#f1f5f9",
    accentColor: "#38bdf8",
    borderColor: "#1e293b",
    cardColor: "#0f172a",
    fontChoice: "Inter",
    timerFontSize: "7rem",
    borderRadius: 12,
  },
  forest: {
    preset: "forest",
    backgroundColor: "#0a100d",
    textColor: "#e8f5e9",
    accentColor: "#4ade80",
    borderColor: "#1b2a22",
    cardColor: "#111b15",
    fontChoice: "Inter",
    timerFontSize: "7rem",
    borderRadius: 12,
  },
  cyber: {
    preset: "cyber",
    backgroundColor: "#030305",
    textColor: "#f3e8ff",
    accentColor: "#c084fc",
    borderColor: "#2e1065",
    cardColor: "#0d0915",
    fontChoice: "Space Grotesk",
    timerFontSize: "7rem",
    borderRadius: 12,
  },
  light: {
    preset: "light",
    backgroundColor: "#f9fafb",
    textColor: "#111827",
    accentColor: "#000000",
    borderColor: "#e5e7eb",
    cardColor: "#ffffff",
    fontChoice: "Inter",
    timerFontSize: "7rem",
    borderRadius: 12,
  },
};

export const BUILT_IN_WALLPAPERS = [
  {
    id: "preset-minimal-1",
    name: "Pure Dark Minimal",
    type: "preset",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80",
    thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=60",
  },
  {
    id: "preset-minimal-2",
    name: "Night Study Desk",
    type: "preset",
    url: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=1920&q=80",
    thumbnail: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=300&q=60",
  },
  {
    id: "preset-minimal-3",
    name: "Architectural Noir",
    type: "preset",
    url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1920&q=80",
    thumbnail: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=300&q=60",
  },
  {
    id: "preset-minimal-4",
    name: "Tokyo Midnight Rain",
    type: "preset",
    url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1920&q=80",
    thumbnail: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=300&q=60",
  },
  {
    id: "preset-minimal-5",
    name: "Deep Cosmos",
    type: "preset",
    url: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1920&q=80",
    thumbnail: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=300&q=60",
  },
  {
    id: "preset-minimal-6",
    name: "Nordic Mist Fog",
    type: "preset",
    url: "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=1920&q=80",
    thumbnail: "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=300&q=60",
  },
  {
    id: "preset-minimal-7",
    name: "Quiet Library",
    type: "preset",
    url: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1920&q=80",
    thumbnail: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=300&q=60",
  },
  {
    id: "preset-minimal-8",
    name: "Monochrome Geometric",
    type: "preset",
    url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80",
    thumbnail: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=300&q=60",
  },
  {
    id: "preset-minimal-9",
    name: "Zen Coffee Steam",
    type: "preset",
    url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1920&q=80",
    thumbnail: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=300&q=60",
  },
  {
    id: "preset-minimal-10",
    name: "Cyber Grid Horizon",
    type: "preset",
    url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1920&q=80",
    thumbnail: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=300&q=60",
  },
];

interface ThemeState {
  theme: ThemeConfig;
  wallpaper: WallpaperConfig;
  setTheme: (newTheme: Partial<ThemeConfig>) => void;
  applyPreset: (presetKey: string) => void;
  setWallpaper: (newWallpaper: Partial<WallpaperConfig>) => void;
  resetTheme: () => void;
  applyCssVariables: () => void;
  hydrateFromUser: (userTheme?: Partial<ThemeConfig>, userWallpaper?: Partial<WallpaperConfig>) => void;
}

const DEFAULT_THEME: ThemeConfig = {
  preset: "black-white",
  backgroundColor: "#000000",
  textColor: "#ffffff",
  accentColor: "#ffffff",
  borderColor: "#262626",
  cardColor: "#0a0a0a",
  fontChoice: "Inter",
  timerFontSize: "7rem",
  borderRadius: 12,
  showSeconds: true,
  clockFormat: "24h",
  digitStyle: "normal",
};

const DEFAULT_WALLPAPER: WallpaperConfig = {
  type: "preset",
  url: BUILT_IN_WALLPAPERS[0].url,
  overlayOpacity: 0.5,
  blurAmount: 0,
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: DEFAULT_THEME,
      wallpaper: DEFAULT_WALLPAPER,

      setTheme: (newTheme) => {
        set((state) => {
          const updated = { ...state.theme, ...newTheme };
          return { theme: updated };
        });
        get().applyCssVariables();
      },

      applyPreset: (presetKey) => {
        const preset = PRESET_THEMES[presetKey];
        if (preset) {
          set((state) => ({
            theme: { ...state.theme, ...preset, preset: presetKey },
          }));
          get().applyCssVariables();
        }
      },

      setWallpaper: (newWallpaper) => {
        set((state) => {
          let resolvedUrl = newWallpaper.url !== undefined ? newWallpaper.url : state.wallpaper.url;
          if (resolvedUrl) {
            const match = BUILT_IN_WALLPAPERS.find((w) => w.id === resolvedUrl);
            if (match) {
              resolvedUrl = match.url;
            }
          }
          return {
            wallpaper: {
              ...state.wallpaper,
              ...newWallpaper,
              url: resolvedUrl,
            },
          };
        });
      },

      hydrateFromUser: (userTheme, userWallpaper) => {
        set((state) => {
          let updatedWallpaper = state.wallpaper;
          if (userWallpaper && (userWallpaper.url || userWallpaper.type)) {
            let resolvedUrl = userWallpaper.url || "";
            const match = BUILT_IN_WALLPAPERS.find((w) => w.id === resolvedUrl);
            if (match) {
              resolvedUrl = match.url;
            }
            updatedWallpaper = {
              ...state.wallpaper,
              ...userWallpaper,
              url: resolvedUrl || state.wallpaper.url,
            };
          }

          let updatedTheme = state.theme;
          if (userTheme && (userTheme.preset || userTheme.backgroundColor)) {
            updatedTheme = {
              ...state.theme,
              ...userTheme,
            };
          }

          return {
            wallpaper: updatedWallpaper,
            theme: updatedTheme,
          };
        });
        get().applyCssVariables();
      },

      resetTheme: () => {
        set({ theme: DEFAULT_THEME, wallpaper: DEFAULT_WALLPAPER });
        get().applyCssVariables();
      },

      applyCssVariables: () => {
        if (typeof document === "undefined") return;
        const { theme } = get();
        const root = document.documentElement;

        root.style.setProperty("--background", theme.backgroundColor);
        root.style.setProperty("--foreground", theme.textColor);
        root.style.setProperty("--primary", theme.accentColor);
        root.style.setProperty("--border", theme.borderColor);
        root.style.setProperty("--card", theme.cardColor);
        root.style.setProperty("--radius", `${theme.borderRadius}px`);
        root.style.setProperty("--timer-font-size", theme.timerFontSize);
      },
    }),
    {
      name: "focusdesk-theme-storage",
    }
  )
);

