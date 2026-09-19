"use client";

import { Play, Pause, Volume2, VolumeX } from "lucide-react";
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
}: Props) {
  return (
    <div className="glass rounded-2xl p-4 md:p-5 flex flex-col gap-3 shadow-2xl">
      {/* Meta */}
      {(title || artist) && (
        <div className="text-center mb-1">
          <p className="font-semibold text-sm md:text-base truncate">{title}</p>
          {artist && (
            <p className="text-xs text-white/50 truncate">{artist}</p>
          )}
        </div>
      )}

      {/* Progress */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-white/50 w-10 text-right tabular-nums">
          {formatTime(currentTime)}
        </span>
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.1}
          value={currentTime}
          onChange={(e) => onSeek(parseFloat(e.target.value))}
          className="flex-1 h-1.5 appearance-none bg-white/20 rounded-full cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:shadow-md"
        />
        <span className="text-xs text-white/50 w-10 tabular-nums">
          {formatTime(duration)}
        </span>
      </div>

      {/* Main controls */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleMute}
            className="p-2 rounded-full hover:bg-white/10 transition"
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted || volume === 0 ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={muted ? 0 : volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-16 sm:w-20 h-1 appearance-none bg-white/20 rounded-full cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
          />
        </div>

        <button
          onClick={onTogglePlay}
          className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center
            hover:scale-105 active:scale-95 transition shadow-lg shrink-0"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 fill-current" />
          ) : (
            <Play className="w-5 h-5 fill-current ml-0.5" />
          )}
        </button>

        {/* Style picker – scrollable */}
        <div className="flex gap-1 overflow-x-auto max-w-[180px] sm:max-w-[280px] md:max-w-none scrollbar-none py-0.5">
          {STYLES.map((s) => (
            <button
              key={s.value}
              onClick={() => onStyleChange(s.value)}
              className={clsx(
                "px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition shrink-0",
                style === s.value
                  ? "bg-white text-black"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
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
