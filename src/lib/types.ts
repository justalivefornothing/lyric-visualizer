export interface LyricLine {
  text: string;
  startTime: number; // seconds
}

export interface SongMeta {
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  youtubeId?: string;
  spotifyId?: string;
  coverUrl?: string;
}

export type AnimationStyle =
  | "drop"
  | "shatter"
  | "bounce"
  | "glitch"
  | "wave"
  | "scale"
  | "typewriter"
  | "fragment"
  | "orbit"
  | "chaos"
  | "random";

export interface LrcLibResponse {
  id: number;
  name: string;
  trackName: string;
  artistName: string;
  albumName: string;
  duration: number;
  instrumental: boolean;
  plainLyrics: string | null;
  syncedLyrics: string | null;
}
