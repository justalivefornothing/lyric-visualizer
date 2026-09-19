"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";
import { LyricLine, AnimationStyle } from "@/lib/types";
import clsx from "clsx";

interface Props {
  lines: LyricLine[];
  currentTime: number;
  style: AnimationStyle;
  isPlaying: boolean;
}

const STYLES: AnimationStyle[] = [
  "drop",
  "shatter",
  "bounce",
  "glitch",
  "wave",
  "scale",
  "typewriter",
];

function pickStyle(style: AnimationStyle, index: number): AnimationStyle {
  if (style !== "random") return style;
  return STYLES[index % STYLES.length];
}

export default function LyricVisualizer({
  lines,
  currentTime,
  style,
  isPlaying,
}: Props) {
  // Find the active line (last line whose startTime <= currentTime)
  const activeIndex = useMemo(() => {
    if (!lines.length) return -1;
    let idx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startTime <= currentTime + 0.15) idx = i;
      else break;
    }
    return idx;
  }, [lines, currentTime]);

  const activeLine = activeIndex >= 0 ? lines[activeIndex] : null;
  const prevLine = activeIndex > 0 ? lines[activeIndex - 1] : null;

  const currentStyle = pickStyle(style, activeIndex);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20 blur-3xl"
          animate={{
            background: [
              "radial-gradient(circle, #6366f1 0%, transparent 70%)",
              "radial-gradient(circle, #ec4899 0%, transparent 70%)",
              "radial-gradient(circle, #06b6d4 0%, transparent 70%)",
              "radial-gradient(circle, #6366f1 0%, transparent 70%)",
            ],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        />
      </div>

      <AnimatePresence mode="wait">
        {activeLine && (
          <motion.div
            key={`${activeIndex}-${activeLine.text}`}
            className="relative z-10 px-6 max-w-5xl text-center"
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <LyricText
              text={activeLine.text}
              style={currentStyle}
              isPlaying={isPlaying}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtle previous line fading out at bottom */}
      {prevLine && (
        <motion.p
          key={`prev-${activeIndex}`}
          initial={{ opacity: 0.4, y: 0 }}
          animate={{ opacity: 0, y: 40 }}
          transition={{ duration: 1.2 }}
          className="absolute bottom-24 left-0 right-0 text-center text-white/30 text-lg md:text-xl font-medium px-8 truncate"
        >
          {prevLine.text}
        </motion.p>
      )}

      {/* Progress dots / timeline hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-1.5 opacity-40">
        {lines.slice(Math.max(0, activeIndex - 4), activeIndex + 5).map((_, i) => (
          <div
            key={i}
            className={clsx(
              "w-1.5 h-1.5 rounded-full transition-all",
              i === 4 ? "bg-white scale-125" : "bg-white/40"
            )}
          />
        ))}
      </div>
    </div>
  );
}

function LyricText({
  text,
  style,
  isPlaying,
}: {
  text: string;
  style: AnimationStyle;
  isPlaying: boolean;
}) {
  const words = text.split(/\s+/);

  if (style === "typewriter") {
    return (
      <motion.h1
        className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {words.map((word, i) => (
          <motion.span
            key={i}
            className="inline-block mr-[0.3em]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.08, duration: 0.15 }}
          >
            {word}
          </motion.span>
        ))}
      </motion.h1>
    );
  }

  if (style === "drop") {
    // Ball-drop style: words fall from above and bounce
    return (
      <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-none">
        {words.map((word, i) => (
          <motion.span
            key={i}
            className="inline-block mr-[0.25em]"
            initial={{ y: -180, opacity: 0, rotate: -12 }}
            animate={{
              y: 0,
              opacity: 1,
              rotate: 0,
              transition: {
                type: "spring",
                stiffness: 120,
                damping: 12,
                delay: i * 0.06,
              },
            }}
            exit={{
              y: 80,
              opacity: 0,
              transition: { duration: 0.25 },
            }}
          >
            {word}
          </motion.span>
        ))}
      </h1>
    );
  }

  if (style === "shatter") {
    // Words explode outward then settle
    return (
      <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight">
        {words.map((word, i) => {
          const angle = (i / words.length) * Math.PI * 2;
          const dist = 120 + Math.random() * 80;
          return (
            <motion.span
              key={i}
              className="inline-block mr-[0.3em]"
              initial={{
                x: Math.cos(angle) * dist,
                y: Math.sin(angle) * dist,
                opacity: 0,
                scale: 0.3,
                rotate: Math.random() * 60 - 30,
              }}
              animate={{
                x: 0,
                y: 0,
                opacity: 1,
                scale: 1,
                rotate: 0,
                transition: {
                  type: "spring",
                  stiffness: 90,
                  damping: 14,
                  delay: i * 0.04,
                },
              }}
              exit={{
                scale: 0,
                opacity: 0,
                filter: "blur(8px)",
                transition: { duration: 0.3 },
              }}
            >
              {word}
            </motion.span>
          );
        })}
      </h1>
    );
  }

  if (style === "bounce") {
    return (
      <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
        {words.map((word, i) => (
          <motion.span
            key={i}
            className="inline-block mr-[0.28em]"
            initial={{ y: 60, opacity: 0, scale: 0.6 }}
            animate={{
              y: [60, -18, 0],
              opacity: 1,
              scale: [0.6, 1.15, 1],
              transition: {
                duration: 0.55,
                delay: i * 0.05,
                times: [0, 0.6, 1],
                ease: "easeOut",
              },
            }}
            exit={{ y: -40, opacity: 0, transition: { duration: 0.2 } }}
          >
            {word}
          </motion.span>
        ))}
      </h1>
    );
  }

  if (style === "glitch") {
    return (
      <motion.h1
        className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <span className="relative z-10">{text}</span>
        <motion.span
          className="absolute inset-0 text-cyan-400 opacity-70"
          style={{ clipPath: "inset(0 0 60% 0)" }}
          animate={{
            x: [0, -4, 3, -2, 0],
            opacity: [0.7, 0.9, 0.5, 0.8, 0.7],
          }}
          transition={{ duration: 0.4, repeat: 2 }}
        >
          {text}
        </motion.span>
        <motion.span
          className="absolute inset-0 text-pink-500 opacity-70"
          style={{ clipPath: "inset(40% 0 0 0)" }}
          animate={{
            x: [0, 3, -4, 2, 0],
            opacity: [0.7, 0.5, 0.9, 0.6, 0.7],
          }}
          transition={{ duration: 0.35, repeat: 2, delay: 0.05 }}
        >
          {text}
        </motion.span>
      </motion.h1>
    );
  }

  if (style === "wave") {
    return (
      <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
        {words.map((word, i) => (
          <motion.span
            key={i}
            className="inline-block mr-[0.28em]"
            initial={{ y: 40, opacity: 0 }}
            animate={{
              y: [40, -12, 0],
              opacity: 1,
              transition: {
                duration: 0.6,
                delay: i * 0.07,
                ease: [0.22, 1, 0.36, 1],
              },
            }}
            exit={{ opacity: 0, y: -20 }}
          >
            {word}
          </motion.span>
        ))}
      </h1>
    );
  }

  // default: scale
  return (
    <motion.h1
      className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter"
      initial={{ scale: 0.4, opacity: 0, filter: "blur(12px)" }}
      animate={{
        scale: 1,
        opacity: 1,
        filter: "blur(0px)",
        transition: { type: "spring", stiffness: 140, damping: 16 },
      }}
      exit={{
        scale: 1.2,
        opacity: 0,
        filter: "blur(8px)",
        transition: { duration: 0.25 },
      }}
    >
      {text}
    </motion.h1>
  );
}
