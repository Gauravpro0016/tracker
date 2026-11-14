export type MusicType = "spotify" | "youtube" | "ambient" | "none";

export interface ParsedMusic {
  type: "spotify" | "youtube";
  id: string;
  mediaType?: "track" | "playlist" | "album" | "artist" | "episode" | "video";
  title: string;
  embedUrl: string;
  originalUrl: string;
}

export interface MusicPreset {
  id: string;
  title: string;
  subtitle: string;
  type: "spotify" | "youtube";
  embedUrl: string;
  originalUrl: string;
  iconName: string;
  badge: string;
}

export const YOUTUBE_PRESETS: MusicPreset[] = [
  {
    id: "yt-lofi-girl",
    title: "Lofi Girl 24/7",
    subtitle: "Beats to relax/study to",
    type: "youtube",
    embedUrl: "https://www.youtube-nocookie.com/embed/jfKfPfyJRdk?autoplay=1&enablejsapi=1",
    originalUrl: "https://www.youtube.com/watch?v=jfKfPfyJRdk",
    iconName: "Headphones",
    badge: "24/7 Live",
  },
  {
    id: "yt-synthwave",
    title: "Synthwave Radio",
    subtitle: "Chill cyberpunk & retro beats",
    type: "youtube",
    embedUrl: "https://www.youtube-nocookie.com/embed/4xDzrJKXOOY?autoplay=1&enablejsapi=1",
    originalUrl: "https://www.youtube.com/watch?v=4xDzrJKXOOY",
    iconName: "Radio",
    badge: "Synthwave",
  },
  {
    id: "yt-zelda-chill",
    title: "Zelda & Chill",
    subtitle: "Nostalgic acoustic study vibes",
    type: "youtube",
    embedUrl: "https://www.youtube-nocookie.com/embed/5qap5aO4i9A?autoplay=1&enablejsapi=1",
    originalUrl: "https://www.youtube.com/watch?v=5qap5aO4i9A",
    iconName: "Gamepad2",
    badge: "Gaming",
  },
  {
    id: "yt-alpha-waves",
    title: "Alpha Study Waves",
    subtitle: "Binaural deep focus frequencies",
    type: "youtube",
    embedUrl: "https://www.youtube-nocookie.com/embed/WPni755-Krg?autoplay=1&enablejsapi=1",
    originalUrl: "https://www.youtube.com/watch?v=WPni755-Krg",
    iconName: "Waves",
    badge: "ADHD / Focus",
  },
  {
    id: "yt-rain-cafe",
    title: "Cozy Rain Cafe",
    subtitle: "Gentle rain & coffee shop sounds",
    type: "youtube",
    embedUrl: "https://www.youtube-nocookie.com/embed/mPZkdNFkNps?autoplay=1&enablejsapi=1",
    originalUrl: "https://www.youtube.com/watch?v=mPZkdNFkNps",
    iconName: "CloudRain",
    badge: "Ambience",
  },
];

export const SPOTIFY_PRESETS: MusicPreset[] = [
  {
    id: "sp-lofi-beats",
    title: "Lofi Beats",
    subtitle: "The definitive study playlist",
    type: "spotify",
    embedUrl: "https://open.spotify.com/embed/playlist/37i9dQZF1DX8Uebhn9wzrS?utm_source=generator&theme=0",
    originalUrl: "https://open.spotify.com/playlist/37i9dQZF1DX8Uebhn9wzrS",
    iconName: "Disc3",
    badge: "Spotify Official",
  },
  {
    id: "sp-deep-focus",
    title: "Deep Focus",
    subtitle: "Calm instrumental post-rock",
    type: "spotify",
    embedUrl: "https://open.spotify.com/embed/playlist/37i9dQZF1DWZeKCadgRdKQ?utm_source=generator&theme=0",
    originalUrl: "https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ",
    iconName: "Brain",
    badge: "Instrumental",
  },
  {
    id: "sp-peaceful-piano",
    title: "Peaceful Piano",
    subtitle: "Soft and tranquil piano works",
    type: "spotify",
    embedUrl: "https://open.spotify.com/embed/playlist/37i9dQZF1DX4sWSpwq3LiO?utm_source=generator&theme=0",
    originalUrl: "https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO",
    iconName: "Music",
    badge: "Acoustic",
  },
  {
    id: "sp-jazz-vibes",
    title: "Jazz in the Background",
    subtitle: "Relaxed vintage coffee shop jazz",
    type: "spotify",
    embedUrl: "https://open.spotify.com/embed/playlist/37i9dQZF1DXbITWG1ZJKYt?utm_source=generator&theme=0",
    originalUrl: "https://open.spotify.com/playlist/37i9dQZF1DXbITWG1ZJKYt",
    iconName: "Coffee",
    badge: "Jazz",
  },
];

/**
 * High-speed URL parser for Spotify & YouTube links (0ms local regex).
 * Supports all standard, shortened, embed, and URI formats.
 */
export function parseMusicUrl(rawUrl: string): ParsedMusic | null {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const url = rawUrl.trim();

  // 1. Spotify parsing
  // Matches: open.spotify.com/(track|playlist|album|artist|episode|show)/[id]
  const spotifyWebMatch = url.match(
    /open\.spotify\.com\/(track|playlist|album|artist|episode|show)\/([a-zA-Z0-9]+)/i
  );
  if (spotifyWebMatch) {
    const mediaType = spotifyWebMatch[1] as ParsedMusic["mediaType"];
    const id = spotifyWebMatch[2];
    const embedUrl = `https://open.spotify.com/embed/${mediaType}/${id}?utm_source=generator&theme=0`;
    const title = `Spotify ${mediaType ? mediaType.charAt(0).toUpperCase() + mediaType.slice(1) : "Playlist"}`;
    return {
      type: "spotify",
      id,
      mediaType,
      title,
      embedUrl,
      originalUrl: url,
    };
  }

  // Matches: spotify:(track|playlist|album|artist):[id]
  const spotifyUriMatch = url.match(
    /spotify:(track|playlist|album|artist):([a-zA-Z0-9]+)/i
  );
  if (spotifyUriMatch) {
    const mediaType = spotifyUriMatch[1] as ParsedMusic["mediaType"];
    const id = spotifyUriMatch[2];
    const embedUrl = `https://open.spotify.com/embed/${mediaType}/${id}?utm_source=generator&theme=0`;
    const title = `Spotify ${mediaType ? mediaType.charAt(0).toUpperCase() + mediaType.slice(1) : "Playlist"}`;
    return {
      type: "spotify",
      id,
      mediaType,
      title,
      embedUrl,
      originalUrl: `https://open.spotify.com/${mediaType}/${id}`,
    };
  }

  // 2. YouTube parsing
  // Matches standard watch?v=, youtu.be/, embed/, shorts/, live/
  const ytVideoMatch = url.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|live|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/i
  );
  const ytPlaylistMatch = url.match(/[?&]list=([a-zA-Z0-9_-]+)/i);

  if (ytVideoMatch) {
    const videoId = ytVideoMatch[1];
    const playlistId = ytPlaylistMatch ? ytPlaylistMatch[1] : null;
    let embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&enablejsapi=1`;
    if (playlistId) {
      embedUrl += `&list=${playlistId}`;
    }
    return {
      type: "youtube",
      id: videoId,
      mediaType: "video",
      title: "YouTube Video",
      embedUrl,
      originalUrl: url,
    };
  } else if (ytPlaylistMatch) {
    const playlistId = ytPlaylistMatch[1];
    const embedUrl = `https://www.youtube-nocookie.com/embed/videoseries?list=${playlistId}&autoplay=1`;
    return {
      type: "youtube",
      id: playlistId,
      mediaType: "playlist",
      title: "YouTube Playlist",
      embedUrl,
      originalUrl: url,
    };
  }

  return null;
}

