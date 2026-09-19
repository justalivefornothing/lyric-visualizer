"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  Search,
  Link2,
  Loader2,
  Music2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
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
  const focusMode = hasLyrics && playing;

  return (
    <main className="min-h-[100dvh] flex flex-col relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[#020204]" />
        <div
          className="absolute -top-[25%] -left-[15%] w-[80vw] h-[80vw] rounded-full opacity-[0.45] blur-[90px] sm:blur-[140px]"
          style={{
            background:
              "radial-gradient(circle, rgba(79,70,229,0.6) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute top-[25%] -right-[20%] w-[65vw] h-[65vw] rounded-full opacity-40 blur-[80px] sm:blur-[120px]"
          style={{
            background:
              "radial-gradient(circle, rgba(219,39,119,0.5) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute -bottom-[15%] left-[15%] w-[55vw] h-[55vw] rounded-full opacity-35 blur-[80px] sm:blur-[120px]"
          style={{
            background:
              "radial-gradient(circle, rgba(6,182,212,0.4) 0%, transparent 70%)",
          }}
        />
        {hasLyrics && (
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vmin] h-[95vmin] rounded-full opacity-25 blur-[70px] transition-opacity duration-700"
            style={{
              background:
                "radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 60%)",
            }}
          />
        )}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_15%,rgba(0,0,0,0.75)_100%)]" />
      </div>

      {/* Header – fades in focus mode */}
      <header
        className={`relative z-20 pt-[max(0.6rem,env(safe-area-inset-top))] pb-2 px-3 sm:px-4 sm:pt-6 sm:pb-3 transition-all duration-500 ${
          focusMode ? "opacity-30 hover:opacity-100" : "opacity-100"
        }`}
      >
        <div className="max-w-2xl mx-auto text-center mb-2.5 sm:mb-4">
          <div className="inline-flex items-center gap-2 mb-1">
            <div className="relative">
              <Music2 className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-300" />
              <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-pink-400 absolute -top-0.5 -right-1" />
            </div>
            <h1 className="text-lg sm:text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-indigo-100 to-pink-200 bg-clip-text text-transparent">
              Lyric Visualizer
            </h1>
          </div>
          {!hasLyrics && (
            <p className="text-white/35 text-xs sm:text-sm">
              Paste a YouTube link or type Song – Artist
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto flex gap-2">
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
              className="w-full pl-9 sm:pl-11 pr-3 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl bg-white/[0.05] border border-white/10
                focus:border-indigo-400/50 outline-none text-sm sm:text-base
                text-white placeholder:text-white/25 transition-all duration-200"
              disabled={loading}
              enterKeyHint="go"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600
              active:scale-[0.97] disabled:opacity-40 font-semibold transition-all
              flex items-center justify-center shadow-lg shadow-indigo-900/50
              touch-manipulation min-w-[3.25rem]"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Go"}
          </button>
        </form>

        {error && (
          <div className="max-w-2xl mx-auto mt-2 flex items-start gap-2 text-amber-200/90 text-xs sm:text-sm bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2.5">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span className="leading-snug">{error}</span>
          </div>
        )}
      </header>

      {/* Stage */}
      <section className="relative z-10 flex-1 flex items-center justify-center min-h-0 px-2">
        {hasLyrics ? (
          <LyricVisualizer
            lines={lines}
            currentTime={currentTime}
            style={style}
            isPlaying={playing}
          />
        ) : (
          <div className="text-center select-none px-4">
            <div className="relative inline-block mb-5">
              <div className="absolute inset-0 blur-3xl bg-indigo-500/25 rounded-full scale-[2]" />
              <Music2 className="relative w-16 h-16 sm:w-20 sm:h-20 text-white/12" />
            </div>
            <p className="text-lg sm:text-2xl font-medium text-white/20 tracking-wide">
              Kinetic lyrics appear here
            </p>
            <p className="mt-2 text-xs sm:text-sm text-white/12 max-w-xs mx-auto">
              Drop · Shatter · Fragment · Chaos · Orbit
            </p>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="relative z-20 px-3 pt-1 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4 sm:pb-5">
        <div className="max-w-3xl mx-auto">
          {url && (
            <div
              className={`mb-2 rounded-xl overflow-hidden aspect-video mx-auto bg-black/70 border border-white/5 shadow-2xl transition-all duration-500 ${
                focusMode
                  ? "max-h-16 max-w-[140px] opacity-60"
                  : "max-h-24 sm:max-h-36 md:max-h-40 max-w-[180px] sm:max-w-sm opacity-100"
              }`}
            >
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
                onProgress={({ playedSeconds }) => setCurrentTime(playedSeconds)}
                onEnded={() => setPlaying(false)}
                config={{
                  youtube: {
                    playerVars: { modestbranding: 1, rel: 0, showinfo: 0 },
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
