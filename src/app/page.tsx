"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { Search, Link2, Loader2, Music2, AlertCircle } from "lucide-react";
import LyricVisualizer from "@/components/LyricVisualizer";
import PlayerControls from "@/components/PlayerControls";
import {
  fetchLyrics,
  extractYouTubeId,
  extractSpotifyId,
  parseSearchQuery,
} from "@/lib/lyrics";
import { LyricLine, AnimationStyle, SongMeta } from "@/lib/types";

// react-player needs dynamic import (no SSR)
const ReactPlayer = dynamic(() => import("react-player/lazy"), { ssr: false });

export default function Home() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lines, setLines] = useState<LyricLine[]>([]);
  const [meta, setMeta] = useState<SongMeta | null>(null);
  const [url, setUrl] = useState<string | null>(null); // playable URL

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [muted, setMuted] = useState(false);
  const [style, setStyle] = useState<AnimationStyle>("random");

  const playerRef = useRef<any>(null);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll current time while playing (react-player onProgress is a bit laggy for lyrics)
  useEffect(() => {
    if (playing) {
      progressInterval.current = setInterval(() => {
        if (playerRef.current) {
          const t = playerRef.current.getCurrentTime?.() ?? 0;
          setCurrentTime(t);
        }
      }, 80);
    } else if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
    };
  }, [playing]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      const q = input.trim();
      if (!q) return;

      setLoading(true);
      setError(null);
      setLines([]);
      setMeta(null);
      setUrl(null);
      setPlaying(false);
      setCurrentTime(0);

      try {
        let title = "";
        let artist = "";
        let youtubeId: string | null = null;
        let spotifyId: string | null = null;
        let playUrl: string | null = null;

        // Detect link type
        youtubeId = extractYouTubeId(q);
        spotifyId = extractSpotifyId(q);

        if (youtubeId) {
          playUrl = `https://www.youtube.com/watch?v=${youtubeId}`;
          // We still need title/artist for lyrics. Use oEmbed to get title.
          try {
            const oembed = await fetch(
              `https://www.youtube.com/oembed?url=${encodeURIComponent(playUrl)}&format=json`
            );
            if (oembed.ok) {
              const data = await oembed.json();
              const fullTitle: string = data.title || "";
              // Common pattern: "Artist - Title" or "Title by Artist"
              const parsed = parseSearchQuery(fullTitle);
              title = parsed.title;
              artist = parsed.artist || data.author_name || "";
            }
          } catch {
            // fallback
            title = "Unknown Title";
            artist = "Unknown Artist";
          }
        } else if (spotifyId) {
          // Spotify embeds work but we need metadata. Without Spotify API key we can only use the embed.
          // For lyrics we still need title/artist – ask user or try a free lookup.
          setError(
            "Spotify links need title + artist for lyrics right now. Paste a YouTube link or type \"Song Name - Artist\" instead."
          );
          setLoading(false);
          return;
        } else {
          // Plain search query
          const parsed = parseSearchQuery(q);
          title = parsed.title;
          artist = parsed.artist;
          playUrl = null;
        }

        // Fetch lyrics
        const result = await fetchLyrics(title, artist || title);
        if (!result || result.lines.length === 0) {
          setError(
            `No lyrics found for "${title}${artist ? " – " + artist : ""}". Try a different spelling or a YouTube link.`
          );
          setLoading(false);
          return;
        }

        setLines(result.lines);
        setMeta({
          title: result.meta.trackName || title,
          artist: result.meta.artistName || artist,
          album: result.meta.albumName,
          duration: result.meta.duration,
          youtubeId: youtubeId || undefined,
        });

        if (playUrl) {
          setUrl(playUrl);
          // Auto-play after a short delay so player mounts
          setTimeout(() => setPlaying(true), 600);
        } else {
          setError(
            "Lyrics loaded! For audio, paste a YouTube link of the same song (or search + pick a YT result yourself)."
          );
        }
      } catch (err) {
        console.error(err);
        setError("Something went wrong. Try again.");
      } finally {
        setLoading(false);
      }
    },
    [input]
  );

  const handleSeek = (time: number) => {
    setCurrentTime(time);
    playerRef.current?.seekTo?.(time, "seconds");
  };

  return (
    <main className="min-h-screen flex flex-col relative">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/40 via-black to-black pointer-events-none" />

      {/* Header / Search */}
      <header className="relative z-20 pt-8 pb-4 px-4">
        <div className="max-w-2xl mx-auto text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-3">
            <Music2 className="w-7 h-7 text-indigo-400" />
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Lyric Visualizer
            </h1>
          </div>
          <p className="text-white/50 text-sm md:text-base">
            Paste a YouTube link or type "Song – Artist". Watch lyrics explode.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="max-w-2xl mx-auto flex gap-2"
        >
          <div className="relative flex-1">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
              {input.includes("youtube") || input.includes("youtu.be") ? (
                <Link2 className="w-5 h-5" />
              ) : (
                <Search className="w-5 h-5" />
              )}
            </div>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='YouTube URL or "Blinding Lights - The Weeknd"'
              className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10
                focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 outline-none
                text-white placeholder:text-white/30 transition"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50
              disabled:cursor-not-allowed font-medium transition flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Go"
            )}
          </button>
        </form>

        {error && (
          <div className="max-w-2xl mx-auto mt-3 flex items-start gap-2 text-amber-300/90 text-sm bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </header>

      {/* Visualizer Stage */}
      <section className="relative z-10 flex-1 flex items-center justify-center min-h-[50vh] px-2">
        {lines.length > 0 ? (
          <LyricVisualizer
            lines={lines}
            currentTime={currentTime}
            style={style}
            isPlaying={playing}
          />
        ) : (
          <div className="text-center text-white/20 select-none">
            <Music2 className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">Your kinetic lyrics will appear here</p>
          </div>
        )}
      </section>

      {/* Hidden / small player + controls */}
      <footer className="relative z-20 p-4 pb-6">
        <div className="max-w-3xl mx-auto">
          {/* Actual audio/video player (YouTube) – kept small */}
          {url && (
            <div className="mb-3 rounded-xl overflow-hidden aspect-video max-h-40 md:max-h-48 mx-auto w-full max-w-md bg-black/50">
              <ReactPlayer
                ref={playerRef}
                url={url}
                playing={playing}
                volume={volume}
                muted={muted}
                width="100%"
                height="100%"
                controls={false}
                onReady={() => {
                  // duration often available here
                }}
                onDuration={(d) => setDuration(d)}
                onProgress={({ playedSeconds }) => {
                  // backup update
                  setCurrentTime(playedSeconds);
                }}
                onEnded={() => setPlaying(false)}
                config={{
                  youtube: {
                    playerVars: {
                      modestbranding: 1,
                      rel: 0,
                      showinfo: 0,
                    },
                  },
                }}
              />
            </div>
          )}

          {lines.length > 0 && (
            <PlayerControls
              isPlaying={playing}
              onTogglePlay={() => setPlaying((p) => !p)}
              currentTime={currentTime}
              duration={duration || meta?.duration || 0}
              onSeek={handleSeek}
              volume={volume}
              onVolumeChange={(v) => {
                setVolume(v);
                if (v > 0) setMuted(false);
              }}
              muted={muted}
              onToggleMute={() => setMuted((m) => !m)}
              style={style}
              onStyleChange={setStyle}
              title={meta?.title}
              artist={meta?.artist}
            />
          )}
        </div>
      </footer>
    </main>
  );
}
