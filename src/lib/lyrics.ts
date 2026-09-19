import { LyricLine, LrcLibResponse } from "./types";

/** Parse LRC synced lyrics string into timed lines */
export function parseLRC(lrc: string): LyricLine[] {
  const lines: LyricLine[] = [];
  const regex = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]\s*(.*)/g;
  let match;

  while ((match = regex.exec(lrc)) !== null) {
    const minutes = parseInt(match[1], 10);
    const seconds = parseInt(match[2], 10);
    const ms = match[3] ? parseInt(match[3].padEnd(3, "0"), 10) : 0;
    const text = match[4].trim();
    if (!text) continue;

    const startTime = minutes * 60 + seconds + ms / 1000;
    lines.push({ text, startTime });
  }

  return lines.sort((a, b) => a.startTime - b.startTime);
}

/** Fetch lyrics from LRCLIB (free, no key) */
export async function fetchLyrics(
  trackName: string,
  artistName: string,
  albumName?: string,
  duration?: number
): Promise<{ lines: LyricLine[]; meta: Partial<LrcLibResponse> } | null> {
  const params = new URLSearchParams({
    track_name: trackName,
    artist_name: artistName,
  });
  if (albumName) params.set("album_name", albumName);
  if (duration) params.set("duration", String(Math.round(duration)));

  try {
    const res = await fetch(`https://lrclib.net/api/get?${params.toString()}`, {
      headers: {
        "User-Agent": "LyricVisualizer/1.0 (https://github.com/goonerlogy-cyber/lyric-visualizer)",
      },
    });

    if (res.status === 404) {
      // Fallback to search
      return searchAndFetch(trackName, artistName);
    }

    if (!res.ok) return null;

    const data: LrcLibResponse = await res.json();
    if (data.instrumental || !data.syncedLyrics) {
      if (data.plainLyrics) {
        // Approximate timing for plain lyrics
        const plainLines = data.plainLyrics
          .split("\n")
          .map((t) => t.trim())
          .filter(Boolean);
        const approxDuration = data.duration || 180;
        const step = approxDuration / (plainLines.length + 1);
        return {
          lines: plainLines.map((text, i) => ({
            text,
            startTime: step * (i + 1),
          })),
          meta: data,
        };
      }
      return null;
    }

    return {
      lines: parseLRC(data.syncedLyrics),
      meta: data,
    };
  } catch (e) {
    console.error("LRCLIB fetch error", e);
    return null;
  }
}

async function searchAndFetch(
  trackName: string,
  artistName: string
): Promise<{ lines: LyricLine[]; meta: Partial<LrcLibResponse> } | null> {
  try {
    const q = `${trackName} ${artistName}`.trim();
    const res = await fetch(
      `https://lrclib.net/api/search?q=${encodeURIComponent(q)}`,
      {
        headers: {
          "User-Agent": "LyricVisualizer/1.0",
        },
      }
    );
    if (!res.ok) return null;
    const results = await res.json();
    if (!Array.isArray(results) || results.length === 0) return null;

    // Prefer one with synced lyrics
    const best =
      results.find((r: LrcLibResponse) => r.syncedLyrics) || results[0];

    if (!best.syncedLyrics && !best.plainLyrics) return null;

    if (best.syncedLyrics) {
      return { lines: parseLRC(best.syncedLyrics), meta: best };
    }

    // plain fallback
    const plainLines = (best.plainLyrics as string)
      .split("\n")
      .map((t: string) => t.trim())
      .filter(Boolean);
    const step = (best.duration || 180) / (plainLines.length + 1);
    return {
      lines: plainLines.map((text: string, i: number) => ({
        text,
        startTime: step * (i + 1),
      })),
      meta: best,
    };
  } catch {
    return null;
  }
}

/** Extract YouTube video ID from various URL formats */
export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

/** Extract Spotify track ID */
export function extractSpotifyId(url: string): string | null {
  const m = url.match(/spotify\.com\/track\/([a-zA-Z0-9]+)/);
  return m ? m[1] : null;
}

/** Simple heuristic to split "Title - Artist" or "Artist - Title" */
export function parseSearchQuery(query: string): {
  title: string;
  artist: string;
} {
  const cleaned = query.trim();
  // Try common separators
  const seps = [" - ", " – ", " — ", " by ", " | "];
  for (const sep of seps) {
    if (cleaned.includes(sep)) {
      const parts = cleaned.split(sep).map((p) => p.trim());
      if (parts.length >= 2) {
        // Heuristic: shorter one is often artist, but prefer left as title for "Title - Artist"
        return { title: parts[0], artist: parts.slice(1).join(sep) };
      }
    }
  }
  return { title: cleaned, artist: "" };
}
