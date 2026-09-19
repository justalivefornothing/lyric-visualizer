"use client";

import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { useMemo, useEffect, useState, useRef } from "react";
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
  "fragment",
  "orbit",
  "chaos",
];

// Deterministic pseudo-random from index (stable across re-renders)
function seeded(n: number, salt = 0) {
  const x = Math.sin(n * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function pickStyle(style: AnimationStyle, index: number): AnimationStyle {
  if (style !== "random") return style;
  return STYLES[Math.floor(seeded(index, 1) * STYLES.length)];
}

// Simple particle type
interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  color: string;
  char?: string;
}

const COLORS = ["#fff", "#a5b4fc", "#f472b6", "#22d3ee", "#fbbf24", "#c084fc"];

export default function LyricVisualizer({
  lines,
  currentTime,
  style,
  isPlaying,
}: Props) {
  const activeIndex = useMemo(() => {
    if (!lines.length) return -1;
    let idx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startTime <= currentTime + 0.12) idx = i;
      else break;
    }
    return idx;
  }, [lines, currentTime]);

  const activeLine = activeIndex >= 0 ? lines[activeIndex] : null;
  const prevLine = activeIndex > 0 ? lines[activeIndex - 1] : null;
  const currentStyle = pickStyle(style, activeIndex);

  // Camera shake
  const shakeX = useMotionValue(0);
  const shakeY = useMotionValue(0);
  const smoothX = useSpring(shakeX, { stiffness: 400, damping: 18 });
  const smoothY = useSpring(shakeY, { stiffness: 400, damping: 18 });

  // Beat energy (simulated from line transitions + time)
  const [energy, setEnergy] = useState(0);
  const lastIndex = useRef(-1);

  useEffect(() => {
    if (activeIndex !== lastIndex.current && activeIndex >= 0) {
      lastIndex.current = activeIndex;
      // Punch on new line
      const intensity = 0.6 + seeded(activeIndex, 7) * 0.8;
      setEnergy(intensity);
      shakeX.set((seeded(activeIndex, 2) - 0.5) * 14 * intensity);
      shakeY.set((seeded(activeIndex, 3) - 0.5) * 10 * intensity);
      setTimeout(() => {
        shakeX.set(0);
        shakeY.set(0);
      }, 180);
    }
  }, [activeIndex, shakeX, shakeY]);

  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      setEnergy((e) => Math.max(0, e * 0.92));
    }, 50);
    return () => clearInterval(id);
  }, [isPlaying]);

  // Particles
  const [particles, setParticles] = useState<Particle[]>([]);
  const particleId = useRef(0);

  useEffect(() => {
    if (activeIndex < 0 || !activeLine) return;
    const words = activeLine.text.split(/\s+/);
    const newParts: Particle[] = [];
    const count = Math.min(28, 8 + words.length * 3);

    for (let i = 0; i < count; i++) {
      const angle = seeded(activeIndex + i, 9) * Math.PI * 2;
      const speed = 1.5 + seeded(activeIndex + i, 11) * 4;
      newParts.push({
        id: particleId.current++,
        x: (seeded(activeIndex + i, 13) - 0.5) * 60,
        y: (seeded(activeIndex + i, 15) - 0.5) * 40,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        size: 2 + seeded(activeIndex + i, 17) * 5,
        life: 1,
        color: COLORS[Math.floor(seeded(activeIndex + i, 19) * COLORS.length)],
        char:
          seeded(activeIndex + i, 21) > 0.65
            ? words[Math.floor(seeded(activeIndex + i, 23) * words.length)]?.[0] ?? "•"
            : undefined,
      });
    }
    setParticles((prev) => [...prev.slice(-40), ...newParts]);
  }, [activeIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!particles.length) return;
    const id = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.08,
            life: p.life - 0.018,
          }))
          .filter((p) => p.life > 0)
      );
    }, 32);
    return () => clearInterval(id);
  }, [particles.length > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  // Perspective / 3D tilt based on energy
  const perspective = 900 + energy * 200;
  const rotateX = energy * (seeded(activeIndex, 31) - 0.5) * 8;
  const rotateY = energy * (seeded(activeIndex, 33) - 0.5) * 10;

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Deep background layers */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vmin] h-[70vmin] rounded-full opacity-25 blur-3xl"
          animate={{
            background: [
              "radial-gradient(circle, #6366f1 0%, transparent 70%)",
              "radial-gradient(circle, #ec4899 0%, transparent 70%)",
              "radial-gradient(circle, #06b6d4 0%, transparent 70%)",
              "radial-gradient(circle, #a855f7 0%, transparent 70%)",
              "radial-gradient(circle, #6366f1 0%, transparent 70%)",
            ],
            scale: 1 + energy * 0.25,
          }}
          transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
        />
        {/* Scanlines */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.15) 2px, rgba(255,255,255,0.15) 3px)",
          }}
        />
        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.75)_100%)]" />
      </div>

      {/* Particle layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute left-1/2 top-1/2 font-bold select-none"
            style={{
              transform: `translate(${p.x}px, ${p.y}px)`,
              opacity: p.life,
              color: p.color,
              fontSize: p.char ? `${p.size * 3}px` : undefined,
              width: p.char ? undefined : p.size,
              height: p.char ? undefined : p.size,
              borderRadius: p.char ? undefined : "50%",
              background: p.char ? undefined : p.color,
              textShadow: p.char ? `0 0 8px ${p.color}` : undefined,
              filter: `blur(${(1 - p.life) * 2}px)`,
            }}
          >
            {p.char ?? null}
          </div>
        ))}
      </div>

      {/* Main stage with camera shake + 3D */}
      <motion.div
        className="relative z-10 w-full h-full flex items-center justify-center"
        style={{
          x: smoothX,
          y: smoothY,
          perspective: `${perspective}px`,
        }}
      >
        <motion.div
          className="relative px-4 max-w-6xl w-full text-center"
          style={{
            rotateX,
            rotateY,
            transformStyle: "preserve-3d",
          }}
          animate={{
            scale: 1 + energy * 0.04,
          }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          <AnimatePresence mode="wait">
            {activeLine && (
              <motion.div
                key={`${activeIndex}-${activeLine.text}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, filter: "blur(12px)", scale: 1.15 }}
                transition={{ duration: 0.25 }}
              >
                <LyricComposition
                  text={activeLine.text}
                  style={currentStyle}
                  lineIndex={activeIndex}
                  energy={energy}
                  isPlaying={isPlaying}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* Ghost previous line */}
      {prevLine && (
        <motion.p
          key={`prev-${activeIndex}`}
          initial={{ opacity: 0.35, y: 0, filter: "blur(0px)" }}
          animate={{ opacity: 0, y: 50, filter: "blur(6px)" }}
          transition={{ duration: 1.4 }}
          className="absolute bottom-28 left-0 right-0 text-center text-white/25 text-base md:text-xl font-medium px-8 pointer-events-none"
        >
          {prevLine.text}
        </motion.p>
      )}

      {/* Timeline dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-1.5 opacity-40 z-20">
        {lines
          .slice(Math.max(0, activeIndex - 4), activeIndex + 5)
          .map((_, i) => (
            <div
              key={i}
              className={clsx(
                "w-1.5 h-1.5 rounded-full transition-all duration-300",
                i === 4 ? "bg-white scale-150 shadow-[0_0_8px_white]" : "bg-white/40"
              )}
            />
          ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Per-line composition – picks layout + effects based on style     */
/* ------------------------------------------------------------------ */

function LyricComposition({
  text,
  style,
  lineIndex,
  energy,
  isPlaying,
}: {
  text: string;
  style: AnimationStyle;
  lineIndex: number;
  energy: number;
  isPlaying: boolean;
}) {
  const words = text.split(/\s+/).filter(Boolean);

  // Chromatic aberration intensity
  const chroma = 1.5 + energy * 4;

  if (style === "glitch" || style === "chaos") {
    return (
      <GlitchBlock
        text={text}
        words={words}
        lineIndex={lineIndex}
        chroma={chroma}
        chaos={style === "chaos"}
      />
    );
  }

  if (style === "fragment") {
    return <FragmentBlock words={words} lineIndex={lineIndex} energy={energy} />;
  }

  if (style === "orbit") {
    return <OrbitBlock words={words} lineIndex={lineIndex} />;
  }

  // Default word-by-word kinetic for the rest
  return (
    <WordBlock
      words={words}
      style={style}
      lineIndex={lineIndex}
      energy={energy}
      chroma={chroma}
    />
  );
}

/* ---------- Word-by-word with chromatic layers ---------- */

function WordBlock({
  words,
  style,
  lineIndex,
  energy,
  chroma,
}: {
  words: string[];
  style: AnimationStyle;
  lineIndex: number;
  energy: number;
  chroma: number;
}) {
  return (
    <h1 className="relative text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tighter leading-[1.05]">
      {/* Chromatic aberration layers */}
      <span
        className="absolute inset-0 text-cyan-400/60 pointer-events-none select-none"
        style={{
          transform: `translate(${-chroma}px, ${chroma * 0.3}px)`,
          mixBlendMode: "screen",
          filter: "blur(0.4px)",
        }}
        aria-hidden
      >
        {words.map((w, i) => (
          <span key={i} className="inline-block mr-[0.28em]">
            {w}
          </span>
        ))}
      </span>
      <span
        className="absolute inset-0 text-pink-500/50 pointer-events-none select-none"
        style={{
          transform: `translate(${chroma}px, ${-chroma * 0.25}px)`,
          mixBlendMode: "screen",
          filter: "blur(0.4px)",
        }}
        aria-hidden
      >
        {words.map((w, i) => (
          <span key={i} className="inline-block mr-[0.28em]">
            {w}
          </span>
        ))}
      </span>

      {/* Main words */}
      {words.map((word, i) => {
        const delay = i * (style === "typewriter" ? 0.07 : 0.045);
        const r = seeded(lineIndex + i, 41);

        let initial: any = { opacity: 0 };
        let animate: any = { opacity: 1 };
        let exit: any = { opacity: 0, y: -30, filter: "blur(8px)" };

        switch (style) {
          case "drop":
            initial = { y: -160 - r * 80, opacity: 0, rotate: -15 + r * 30, scale: 0.6 };
            animate = {
              y: 0,
              opacity: 1,
              rotate: 0,
              scale: 1,
              transition: {
                type: "spring",
                stiffness: 110 + r * 40,
                damping: 11,
                delay,
              },
            };
            break;
          case "shatter":
            initial = {
              x: (r - 0.5) * 220,
              y: (seeded(lineIndex + i, 43) - 0.5) * 180,
              opacity: 0,
              scale: 0.2,
              rotate: (r - 0.5) * 90,
            };
            animate = {
              x: 0,
              y: 0,
              opacity: 1,
              scale: 1,
              rotate: 0,
              transition: {
                type: "spring",
                stiffness: 85,
                damping: 13,
                delay: i * 0.035,
              },
            };
            break;
          case "bounce":
            initial = { y: 70, opacity: 0, scale: 0.5 };
            animate = {
              y: [70, -22, 0],
              opacity: 1,
              scale: [0.5, 1.18, 1],
              transition: {
                duration: 0.55,
                delay,
                times: [0, 0.55, 1],
                ease: "easeOut",
              },
            };
            break;
          case "wave":
            initial = { y: 50, opacity: 0, rotateX: 40 };
            animate = {
              y: [50, -14, 0],
              opacity: 1,
              rotateX: 0,
              transition: {
                duration: 0.65,
                delay: i * 0.06,
                ease: [0.22, 1, 0.36, 1],
              },
            };
            break;
          case "scale":
            initial = { scale: 0.15, opacity: 0, filter: "blur(16px)" };
            animate = {
              scale: 1,
              opacity: 1,
              filter: "blur(0px)",
              transition: {
                type: "spring",
                stiffness: 130,
                damping: 14,
                delay: i * 0.04,
              },
            };
            break;
          case "typewriter":
            initial = { opacity: 0, y: 8 };
            animate = {
              opacity: 1,
              y: 0,
              transition: { duration: 0.12, delay },
            };
            break;
          default:
            initial = { y: 30, opacity: 0, scale: 0.8 };
            animate = {
              y: 0,
              opacity: 1,
              scale: 1,
              transition: { type: "spring", stiffness: 120, damping: 14, delay },
            };
        }

        return (
          <motion.span
            key={`${lineIndex}-${i}-${word}`}
            className="inline-block mr-[0.28em] relative z-10"
            style={{
              textShadow: `0 0 ${8 + energy * 20}px rgba(255,255,255,${0.25 + energy * 0.4})`,
            }}
            initial={initial}
            animate={animate}
            exit={exit}
          >
            {word}
          </motion.span>
        );
      })}
    </h1>
  );
}

/* ---------- Glitch / Chaos ---------- */

function GlitchBlock({
  text,
  words,
  lineIndex,
  chroma,
  chaos,
}: {
  text: string;
  words: string[];
  lineIndex: number;
  chroma: number;
  chaos: boolean;
}) {
  return (
    <motion.h1
      className="relative text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tighter"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* RGB split layers */}
      <motion.span
        className="absolute inset-0 text-cyan-400 opacity-80"
        style={{ mixBlendMode: "screen" }}
        animate={{
          x: [0, -chroma * 1.5, chroma, -chroma * 0.5, 0],
          y: [0, chroma * 0.4, -chroma * 0.3, 0],
          opacity: [0.7, 0.95, 0.5, 0.85, 0.7],
        }}
        transition={{ duration: 0.35, repeat: chaos ? 3 : 1 }}
      >
        {text}
      </motion.span>
      <motion.span
        className="absolute inset-0 text-pink-500 opacity-70"
        style={{ mixBlendMode: "screen" }}
        animate={{
          x: [0, chroma * 1.8, -chroma, chroma * 0.6, 0],
          y: [0, -chroma * 0.5, chroma * 0.3, 0],
        }}
        transition={{ duration: 0.32, repeat: chaos ? 3 : 1, delay: 0.04 }}
      >
        {text}
      </motion.span>

      {/* Main + occasional slice */}
      <span className="relative z-10">
        {words.map((word, i) => (
          <motion.span
            key={i}
            className="inline-block mr-[0.28em]"
            initial={{
              opacity: 0,
              x: chaos ? (seeded(lineIndex + i, 51) - 0.5) * 80 : 0,
              filter: "blur(4px)",
            }}
            animate={{
              opacity: 1,
              x: 0,
              filter: "blur(0px)",
              transition: { delay: i * 0.04, duration: 0.2 },
            }}
          >
            {word}
          </motion.span>
        ))}
      </span>

      {/* Horizontal tear slices */}
      {chaos &&
        [0.25, 0.55, 0.78].map((pos, i) => (
          <motion.span
            key={i}
            className="absolute left-0 right-0 overflow-hidden text-white/90"
            style={{
              top: `${pos * 100}%`,
              height: "18%",
              clipPath: `inset(0 0 0 0)`,
            }}
            animate={{
              x: [0, (i % 2 === 0 ? 1 : -1) * (12 + chroma * 3), 0],
            }}
            transition={{ duration: 0.2, delay: 0.05 * i, repeat: 2 }}
          >
            <span style={{ transform: `translateY(-${pos * 100}%)` }}>{text}</span>
          </motion.span>
        ))}
    </motion.h1>
  );
}

/* ---------- Fragmentation (letters explode then reform) ---------- */

function FragmentBlock({
  words,
  lineIndex,
  energy,
}: {
  words: string[];
  lineIndex: number;
  energy: number;
}) {
  const letters = words.join(" ").split("");

  return (
    <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tighter leading-none">
      {letters.map((char, i) => {
        if (char === " ") {
          return <span key={i} className="inline-block w-[0.3em]" />;
        }
        const r = seeded(lineIndex + i, 61);
        const angle = r * Math.PI * 2;
        const dist = 80 + r * 140;

        return (
          <motion.span
            key={i}
            className="inline-block"
            style={{
              textShadow: `0 0 ${6 + energy * 16}px rgba(255,255,255,0.5)`,
            }}
            initial={{
              x: Math.cos(angle) * dist,
              y: Math.sin(angle) * dist,
              opacity: 0,
              scale: 0.1,
              rotate: (r - 0.5) * 120,
              filter: "blur(8px)",
            }}
            animate={{
              x: 0,
              y: 0,
              opacity: 1,
              scale: 1,
              rotate: 0,
              filter: "blur(0px)",
              transition: {
                type: "spring",
                stiffness: 70 + r * 50,
                damping: 12,
                delay: i * 0.018,
              },
            }}
            exit={{
              opacity: 0,
              scale: 0,
              filter: "blur(10px)",
              transition: { duration: 0.2 },
            }}
          >
            {char}
          </motion.span>
        );
      })}
    </h1>
  );
}

/* ---------- Orbit (words circle in then land) ---------- */

function OrbitBlock({ words, lineIndex }: { words: string[]; lineIndex: number }) {
  return (
    <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tighter">
      {words.map((word, i) => {
        const r = seeded(lineIndex + i, 71);
        const angle = (i / Math.max(words.length, 1)) * Math.PI * 2 + r;
        const radius = 160 + r * 80;

        return (
          <motion.span
            key={i}
            className="inline-block mr-[0.28em]"
            initial={{
              x: Math.cos(angle) * radius,
              y: Math.sin(angle) * radius,
              opacity: 0,
              scale: 0.3,
              rotate: angle * (180 / Math.PI),
            }}
            animate={{
              x: 0,
              y: 0,
              opacity: 1,
              scale: 1,
              rotate: 0,
              transition: {
                type: "spring",
                stiffness: 95,
                damping: 14,
                delay: i * 0.05,
              },
            }}
          >
            {word}
          </motion.span>
        );
      })}
    </h1>
  );
}
