"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { Search, Link2, Loader2, Music2, AlertCircle, Sparkles } from "lucide-react";
import LyricVisualizer from "@/components/LyricVisualizer";
import PlayerControls from "@/components/PlayerControls";
import {
  fetchLyrics,
  extractYouTubeId,
  extractSpotifyId,
  parseSearchQuery,
} from "@/lib/lyrics";
import { LyricLine, AnimationStyle, SongMeta } from "@/lib/types";

const ReactPlayer = dynamic(() => import("react-player/lazy"), { ssr: false });

export default function Home() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lines, setLines] = useState<LyricLine[]>([]);
  const [meta, setMeta] = useState<SongMeta | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [muted, setMuted] = useState(false);
  const [style, setStyle] = useState<AnimationStyle>("random");

  const playerRef = useRef<any>(null);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);

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

        youtubeId = extractYouTubeId(q);
        spotifyId = extractSpotifyId(q);

        if (youtubeId) {
          playUrl = `https://www.youtube.com/watch?v=${youtubeId}`;
          try {
            const oembed = await fetch(
              `https://www.youtube.com/oembed?url=${encodeURIComponent(playUrl)}&format=json`
            );
            if (oembed.ok) {
              const data = await oembed.json();
              const fullTitle: string = data.title || "";
              const parsed = parseSearchQuery(fullTitle);
              title = parsed.title;
              artist = parsed.artist || data.author_name || "";
            }
          } catch {
            title = "Unknown Title";
            artist = "Unknown Artist";
          }
        } else if (spotifyId) {
          setError(
            'Spotify links need title + artist for lyrics right now. Paste a YouTube link or type "Song Name - Artist" instead.'
          );
          setLoading(false);
          return;
        } else {
          const parsed = parseSearchQuery(q);
          title = parsed.title;
          artist = parsed.artist;
          playUrl = null;
        }

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
          setTimeout(() => setPlaying(true), 600);
        } else {
          setError(
            "Lyrics loaded! For audio, paste a YouTube link of the same song."
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

  const hasLyrics = lines.length > 0;

  return (
    <main className="min-h-[100dvh] flex flex-col relative overflow-hidden">
      {/* ====== MULTI-LAYER CINEMATIC BACKGROUND ====== */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[#030306]" />

        <div
          className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full opacity-40 blur-[80px] sm:blur-[120px]"
          style={{
            background:
              "radial-gradient(circle, rgba(79,70,229,0.55) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute top-[30%] -right-[15%] w-[55vw] h-[55vw] rounded-full opacity-35 blur-[70px] sm:blur-[100px]"
          style={{
            background:
              "radial-gradient(circle, rgba(219,39,119,0.45) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute -bottom-[10%] left-[20%] w-[50vw] h-[50vw] rounded-full opacity-30 blur-[70px] sm:blur-[110px]"
          style={{
            background:
              "radial-gradient(circle, rgba(6,182,212,0.35) 0%, transparent 70%)",
          }}
        />

        <div
          className="absolute inset-0 opacity-[0.03] hidden sm:block"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />

        {hasLyrics && (
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vmin] h-[90vmin] rounded-full opacity-20 blur-[60px] sm:blur-[80px] transition-opacity duration-700"
            style={{
              background:
                "radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 65%)",
            }}
          />
        )}

        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,0.7)_100%)]" />
      </div>

      {/* ====== HEADER – compact on mobile ====== */}
      <header className="relative z-20 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2 px-3 sm:px-4 sm:pt-7 sm:pb-3">
        <div className="max-w-2xl mx-auto text-center mb-3 sm:mb-5">
          <div className="inline-flex items-center gap-2 mb-1 sm:mb-2">
            <div className="relative">
              <Music2 className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-300" />
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-pink-400 absolute -top-1 -right-1.5" />
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-indigo-100 to-pink-200 bg-clip-text text-transparent">
              Lyric Visualizer
            </h1>
          </div>
          <p className="text-white/40 text-xs sm:text-sm md:text-base hidden xs:block sm:block">
            Paste a YouTube link or type {'"Song – Artist"'}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="max-w-2xl mx-auto flex gap-2"
        >
          <div className="relative flex-1 min-w-0">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35 pointer-events-none">
              {input.includes("youtube") || input.includes("youtu.be") ? (
                <Link2 className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </div>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="YouTube URL or Song – Artist"
              className="w-full pl-9 sm:pl-11 pr-3 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-white/[0.04] border border-white/10
                focus:border-indigo-400/40 outline-none text-sm sm:text-base
                text-white placeholder:text-white/25 transition-all duration-200"
              disabled={loading}
              enterKeyHint="go"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 sm:px-6 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600
              active:from-indigo-500 active:to-violet-500 disabled:opacity-40
              disabled:cursor-not-allowed font-semibold transition-all duration-200
              flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/40
              touch-manipulation min-w-[3.5rem] sm:min-w-0"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Go"
            )}
          </button>
        </form>

        {error && (
          <div className="max-w-2xl mx-auto mt-2 sm:mt-3 flex items-start gap-2 text-amber-200/90 text-xs sm:text-sm bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span className="leading-snug">{error}</span>
          </div>
        )}
      </header>

      {/* ====== STAGE – takes remaining space ====== */}
      <section className="relative z-10 flex-1 flex items-center justify-center min-h-0 px-2 py-2">
        {hasLyrics ? (
          <LyricVisualizer
            lines={lines}
            currentTime={currentTime}
            style={style}
            isPlaying={playing}
          />
        ) : (
          <div className="text-center select-none px-4">
            <div className="relative inline-block mb-4 sm:mb-6">
              <div className="absolute inset-0 blur-2xl bg-indigo-500/20 rounded-full scale-150" />
              <Music2 className="relative w-14 h-14 sm:w-20 sm:h-20 text-white/15" />
            </div>
            <p className="text-base sm:text-xl md:text-2xl font-medium text-white/25 tracking-wide">
              Kinetic lyrics appear here
            </p>
            <p className="mt-1.5 text-xs sm:text-sm text-white/15 max-w-xs mx-auto">
              Drop · Shatter · Fragment · Chaos · Orbit
            </p>
          </div>
        )}
      </section>

      {/* ====== FOOTER – safe area, compact video on mobile ====== */}
      <footer className="relative z-20 px-3 pt-1 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4 sm:pb-6">
        <div className="max-w-3xl mx-auto">
          {/* Tiny / hidden video on mobile so lyrics stay front and center */}
          {url && (
            <div className="mb-2 sm:mb-3 rounded-xl sm:rounded-2xl overflow-hidden aspect-video max-h-24 sm:max-h-36 md:max-h-44 mx-auto w-full max-w-[200px] sm:max-w-sm bg-black/60 border border-white/5 shadow-2xl">
              <ReactPlayer
                ref={playerRef}
                url={url}
                playing={playing}
                volume={volume}
                muted={muted}
                width="100%"
                height="100%"
                controls={false}
                onDuration={(d) => setDuration(d)}
                onProgress={({ playedSeconds }) => {
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

          {hasLyrics && (
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
