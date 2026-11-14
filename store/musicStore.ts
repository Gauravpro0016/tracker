import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ParsedMusic, MusicPreset, parseMusicUrl } from "@/lib/music-parser";

interface MusicState {
  currentTrack: ParsedMusic | null;
  isPlaying: boolean;
  isWidgetOpen: boolean;
  isMinimized: boolean;
  customUrlInput: string;
  recentTracks: ParsedMusic[];

  // Actions
  playTrack: (track: ParsedMusic) => void;
  playPreset: (preset: MusicPreset) => void;
  playFromUrl: (url: string) => boolean;
  stopMusic: () => void;
  togglePlay: () => void;
  setWidgetOpen: (open: boolean) => void;
  toggleWidget: () => void;
  setMinimized: (minimized: boolean) => void;
  toggleMinimized: () => void;
  setCustomUrlInput: (input: string) => void;
  clearCurrentTrack: () => void;
}

export const useMusicStore = create<MusicState>()(
  persist(
    (set, get) => ({
      currentTrack: null,
      isPlaying: false,
      isWidgetOpen: false,
      isMinimized: false,
      customUrlInput: "",
      recentTracks: [],

      playTrack: (track: ParsedMusic) => {
        const currentRecents = get().recentTracks.filter(
          (t) => t.id !== track.id || t.type !== track.type
        );
        const updatedRecents = [track, ...currentRecents].slice(0, 6);

        set({
          currentTrack: track,
          isPlaying: true,
          customUrlInput: track.originalUrl,
          recentTracks: updatedRecents,
        });
      },

      playPreset: (preset: MusicPreset) => {
        const track: ParsedMusic = {
          type: preset.type,
          id: preset.id,
          title: preset.title,
          embedUrl: preset.embedUrl,
          originalUrl: preset.originalUrl,
        };
        get().playTrack(track);
      },

      playFromUrl: (url: string) => {
        const parsed = parseMusicUrl(url);
        if (parsed) {
          get().playTrack(parsed);
          return true;
        }
        return false;
      },

      stopMusic: () => {
        set({ isPlaying: false, currentTrack: null });
      },

      togglePlay: () => {
        set((state) => ({ isPlaying: !state.isPlaying }));
      },

      setWidgetOpen: (open: boolean) => {
        set({ isWidgetOpen: open });
      },

      toggleWidget: () => {
        set((state) => ({ isWidgetOpen: !state.isWidgetOpen }));
      },

      setMinimized: (minimized: boolean) => {
        set({ isMinimized: minimized });
      },

      toggleMinimized: () => {
        set((state) => ({ isMinimized: !state.isMinimized }));
      },

      setCustomUrlInput: (input: string) => {
        set({ customUrlInput: input });
      },

      clearCurrentTrack: () => {
        set({ currentTrack: null, isPlaying: false });
      },
    }),
    {
      name: "focusdesk-study-music",
      partialize: (state) => ({
        currentTrack: state.currentTrack,
        recentTracks: state.recentTracks,
        isMinimized: state.isMinimized,
      }),
    }
  )
);

