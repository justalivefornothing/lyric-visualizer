"use client";

import { Play, Pause, Volume2, VolumeX, Maximize2, Minimize2 } from "lucide-react";
import { AnimationStyle } from "@/lib/types";
import clsx from "clsx";

interface Props {
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  volume: number;
  onVolumeChange: (v: number) => void;
  muted: boolean;
  onToggleMute: () => void;
  style: AnimationStyle;
  onStyleChange: (s: AnimationStyle) => void;
  title?: string;
  artist?: string;
  immersive?: boolean;
  onToggleImmersive?: () => void;
}

const STYLES: { value: AnimationStyle; label: string }[] = [
  { value: "random", label: "Random" },
  { value: "drop", label: "Drop" },
  { value: "shatter", label: "Shatter" },
  { value: "bounce", label: "Bounce" },
  { value: "glitch", label: "Glitch" },
  { value: "wave", label: "Wave" },
  { value: "scale", label: "Scale" },
  { value: "typewriter", label: "Type" },
  { value: "fragment", label: "Fragment" },
  { value: "orbit", label: "Orbit" },
  { value: "chaos", label: "Chaos" },
  { value: "pulse", label: "Pulse" },
  { value: "cascade", label: "Cascade" },
  { value: "zoom", label: "Zoom" },
];

function formatTime(s: number) {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function PlayerControls({
  isPlaying,
  onTogglePlay,
  currentTime,
  duration,
  onSeek,
  volume,
  onVolumeChange,
  muted,
  onToggleMute,
  style,
  onStyleChange,
  title,
  artist,
  immersive,
  onToggleImmersive,
}: Props) {
  return (
    <div className="glass rounded-2xl p-3 sm:p-4 md:p-5 flex flex-col gap-2.5 sm:gap-3 shadow-2xl">
      {(title || artist) && (
        <div className="text-center">
          <p className="font-semibold text-sm truncate leading-tight">{title}</p>
          {artist && (
            <p className="text-[11px] sm:text-xs text-white/50 truncate mt-0.5">
              {artist}
            </p>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 sm:gap-3">
        <span className="text-[11px] sm:text-xs text-white/50 w-9 sm:w-10 text-right tabular-nums shrink-0">
          {formatTime(currentTime)}
        </span>
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.1}
          value={currentTime}
          onChange={(e) => onSeek(parseFloat(e.target.value))}
          className="flex-1 h-2 sm:h-1.5 appearance-none bg-white/20 rounded-full cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
            sm:[&::-webkit-slider-thumb]:w-3.5 sm:[&::-webkit-slider-thumb]:h-3.5
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:shadow-md"
        />
        <span className="text-[11px] sm:text-xs text-white/50 w-9 sm:w-10 tabular-nums shrink-0">
          {formatTime(duration)}
        </span>
      </div>

      <div className="flex items-center justify-center gap-3 sm:gap-5">
        <button
          onClick={onToggleMute}
          className="p-2.5 rounded-full hover:bg-white/10 active:bg-white/15 transition touch-manipulation"
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted || volume === 0 ? (
            <VolumeX className="w-5 h-5" />
          ) : (
            <Volume2 className="w-5 h-5" />
          )}
        </button>

        <button
          onClick={onTogglePlay}
          className="w-14 h-14 sm:w-12 sm:h-12 rounded-full bg-white text-black flex items-center justify-center
            active:scale-95 transition shadow-lg touch-manipulation"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="w-6 h-6 sm:w-5 sm:h-5 fill-current" />
          ) : (
            <Play className="w-6 h-6 sm:w-5 sm:h-5 fill-current ml-0.5" />
          )}
        </button>

        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={muted ? 0 : volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          className="w-14 sm:w-20 h-1.5 appearance-none bg-white/20 rounded-full cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
        />

        {onToggleImmersive && (
          <button
            onClick={onToggleImmersive}
            className="p-2.5 rounded-full hover:bg-white/10 active:bg-white/15 transition touch-manipulation"
            aria-label={immersive ? "Exit immersive" : "Immersive mode"}
            title="Immersive (hide chrome)"
          >
            {immersive ? (
              <Minimize2 className="w-5 h-5" />
            ) : (
              <Maximize2 className="w-5 h-5" />
            )}
          </button>
        )}
      </div>

      <div className="-mx-1 px-1 overflow-x-auto scrollbar-none">
        <div className="flex gap-1.5 min-w-max pb-0.5">
          {STYLES.map((s) => (
            <button
              key={s.value}
              onClick={() => onStyleChange(s.value)}
              className={clsx(
                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition touch-manipulation",
                style === s.value
                  ? "bg-white text-black"
                  : "bg-white/10 text-white/70 active:bg-white/20"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
