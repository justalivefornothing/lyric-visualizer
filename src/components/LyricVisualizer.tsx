"use client";

import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
} from "framer-motion";
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
  "pulse",
  "cascade",
  "zoom",
];

function seeded(n: number, salt = 0) {
  const x = Math.sin(n * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function pickStyle(style: AnimationStyle, index: number): AnimationStyle {
  if (style !== "random") return style;
  return STYLES[Math.floor(seeded(index, 1) * STYLES.length)];
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
  char?: string;
  rot: number;
  vr: number;
}

const COLORS = [
  "#ffffff",
  "#c7d2fe",
  "#f9a8d4",
  "#67e8f9",
  "#fde68a",
  "#e9d5ff",
  "#a5f3fc",
];

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
      if (lines[i].startTime <= currentTime + 0.1) idx = i;
      else break;
    }
    return idx;
  }, [lines, currentTime]);

  const activeLine = activeIndex >= 0 ? lines[activeIndex] : null;
  const prevLine = activeIndex > 0 ? lines[activeIndex - 1] : null;
  const nextLine =
    activeIndex >= 0 && activeIndex < lines.length - 1
      ? lines[activeIndex + 1]
      : null;
  const currentStyle = pickStyle(style, Math.max(0, activeIndex));

  const shakeX = useMotionValue(0);
  const shakeY = useMotionValue(0);
  const smoothX = useSpring(shakeX, { stiffness: 380, damping: 16 });
  const smoothY = useSpring(shakeY, { stiffness: 380, damping: 16 });

  const [energy, setEnergy] = useState(0);
  const lastIndex = useRef(-1);

  useEffect(() => {
    if (activeIndex !== lastIndex.current && activeIndex >= 0) {
      lastIndex.current = activeIndex;
      const intensity = 0.7 + seeded(activeIndex, 7) * 0.9;
      setEnergy(intensity);
      shakeX.set((seeded(activeIndex, 2) - 0.5) * 16 * intensity);
      shakeY.set((seeded(activeIndex, 3) - 0.5) * 12 * intensity);
      const t = setTimeout(() => {
        shakeX.set(0);
        shakeY.set(0);
      }, 200);
      return () => clearTimeout(t);
    }
  }, [activeIndex, shakeX, shakeY]);

  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      setEnergy((e) => Math.max(0, e * 0.9));
    }, 40);
    return () => clearInterval(id);
  }, [isPlaying]);

  const [particles, setParticles] = useState<Particle[]>([]);
  const particleId = useRef(0);

  useEffect(() => {
    if (activeIndex < 0 || !activeLine) return;
    const words = activeLine.text.split(/\s+/).filter(Boolean);
    const isMobile =
      typeof window !== "undefined" && window.innerWidth < 640;
    const count = Math.min(isMobile ? 16 : 36, 6 + words.length * 3);
    const newParts: Particle[] = [];

    for (let i = 0; i < count; i++) {
      const angle = seeded(activeIndex + i, 9) * Math.PI * 2;
      const speed = 2 + seeded(activeIndex + i, 11) * 5;
      const life = 0.85 + seeded(activeIndex + i, 25) * 0.4;
      newParts.push({
        id: particleId.current++,
        x: (seeded(activeIndex + i, 13) - 0.5) * 40,
        y: (seeded(activeIndex + i, 15) - 0.5) * 30,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        size: 2 + seeded(activeIndex + i, 17) * 6,
        life,
        maxLife: life,
        color: COLORS[Math.floor(seeded(activeIndex + i, 19) * COLORS.length)],
        char:
          seeded(activeIndex + i, 21) > 0.55
            ? words[
                Math.floor(seeded(activeIndex + i, 23) * words.length)
              ]?.[0] ?? "·"
            : undefined,
        rot: seeded(activeIndex + i, 27) * 360,
        vr: (seeded(activeIndex + i, 29) - 0.5) * 8,
      });
    }
    setParticles((prev) => [...prev.slice(-50), ...newParts]);
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
            vy: p.vy + 0.09,
            rot: p.rot + p.vr,
            life: p.life - 0.016,
          }))
          .filter((p) => p.life > 0)
      );
    }, 30);
    return () => clearInterval(id);
  }, [particles.length > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const perspective = 1000 + energy * 250;
  const rotateX = energy * (seeded(activeIndex, 31) - 0.5) * 10;
  const rotateY = energy * (seeded(activeIndex, 33) - 0.5) * 12;

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(90vmin,700px)] h-[min(90vmin,700px)] rounded-full"
          style={{ opacity: 0.22 + energy * 0.15 }}
          animate={{
            background: [
              "radial-gradient(circle, #6366f1 0%, transparent 68%)",
              "radial-gradient(circle, #db2777 0%, transparent 68%)",
              "radial-gradient(circle, #06b6d4 0%, transparent 68%)",
              "radial-gradient(circle, #8b5cf6 0%, transparent 68%)",
              "radial-gradient(circle, #6366f1 0%, transparent 68%)",
            ],
            scale: 1 + energy * 0.2,
          }}
          transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5"
          style={{
            width: "min(70vmin, 520px)",
            height: "min(70vmin, 520px)",
            opacity: 0.3 + energy * 0.2,
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_25%,rgba(0,0,0,0.55)_100%)]" />
      </div>

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((p) => {
          const t = p.life / p.maxLife;
          return (
            <div
              key={p.id}
              className="absolute left-1/2 top-1/2 font-black select-none will-change-transform"
              style={{
                transform: `translate(${p.x}px, ${p.y}px) rotate(${p.rot}deg)`,
                opacity: t * 0.95,
                color: p.color,
                fontSize: p.char ? `${Math.max(10, p.size * 2.8)}px` : undefined,
                width: p.char ? undefined : p.size,
                height: p.char ? undefined : p.size,
                borderRadius: p.char ? undefined : "50%",
                background: p.char ? undefined : p.color,
                boxShadow: p.char
                  ? `0 0 ${10 * t}px ${p.color}`
                  : `0 0 ${6 * t}px ${p.color}`,
                filter: `blur(${(1 - t) * 2.5}px)`,
              }}
            >
              {p.char ?? null}
            </div>
          );
        })}
      </div>

      <motion.div
        className="relative z-10 w-full h-full flex items-center justify-center"
        style={{ x: smoothX, y: smoothY, perspective: `${perspective}px` }}
      >
        <motion.div
          className="relative px-3 sm:px-6 max-w-5xl w-full text-center"
          style={{
            rotateX,
            rotateY,
            transformStyle: "preserve-3d",
          }}
          animate={{ scale: 1 + energy * 0.05 }}
          transition={{ type: "spring", stiffness: 180, damping: 18 }}
        >
          <AnimatePresence mode="wait">
            {activeLine && (
              <motion.div
                key={`${activeIndex}-${activeLine.text}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{
                  opacity: 0,
                  filter: "blur(14px)",
                  scale: 1.12,
                  y: -20,
                }}
                transition={{ duration: 0.28 }}
              >
                <LyricComposition
                  text={activeLine.text}
                  style={currentStyle}
                  lineIndex={activeIndex}
                  energy={energy}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {prevLine && (
        <motion.p
          key={`prev-${activeIndex}`}
          initial={{ opacity: 0.4, y: 0, filter: "blur(0px)" }}
          animate={{ opacity: 0, y: 36, filter: "blur(8px)" }}
          transition={{ duration: 1.5 }}
          className="absolute bottom-[22%] sm:bottom-24 left-0 right-0 text-center text-white/20 text-sm sm:text-lg font-medium px-6 pointer-events-none line-clamp-1"
        >
          {prevLine.text}
        </motion.p>
      )}

      {nextLine && isPlaying && (
        <motion.p
          key={`next-${activeIndex}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.15 }}
          className="absolute top-[18%] sm:top-16 left-0 right-0 text-center text-white/20 text-xs sm:text-sm font-medium px-6 pointer-events-none line-clamp-1"
        >
          {nextLine.text}
        </motion.p>
      )}

      <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex gap-1 sm:gap-1.5 opacity-50 z-20">
        {lines
          .slice(Math.max(0, activeIndex - 3), activeIndex + 4)
          .map((_, i) => {
            const isActive = i === Math.min(3, activeIndex);
            return (
              <div
                key={i}
                className={clsx(
                  "rounded-full transition-all duration-300",
                  isActive
                    ? "w-4 h-1.5 sm:w-5 sm:h-1.5 bg-white shadow-[0_0_10px_rgba(255,255,255,0.7)]"
                    : "w-1.5 h-1.5 bg-white/30"
                )}
              />
            );
          })}
      </div>
    </div>
  );
}

function LyricComposition({
  text,
  style,
  lineIndex,
  energy,
}: {
  text: string;
  style: AnimationStyle;
  lineIndex: number;
  energy: number;
}) {
  const words = text.split(/\s+/).filter(Boolean);
  const chroma = 2 + energy * 5;

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
    return (
      <FragmentBlock words={words} lineIndex={lineIndex} energy={energy} />
    );
  }
  if (style === "orbit") {
    return <OrbitBlock words={words} lineIndex={lineIndex} />;
  }
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
    <h1 className="relative text-[1.75rem] leading-tight sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tighter lyric-glow">
      <span
        className="absolute inset-0 text-cyan-300/50 pointer-events-none select-none"
        style={{
          transform: `translate(${-chroma}px, ${chroma * 0.25}px)`,
          mixBlendMode: "screen",
        }}
        aria-hidden
      >
        {words.map((w, i) => (
          <span key={i} className="inline-block mr-[0.25em]">
            {w}
          </span>
        ))}
      </span>
      <span
        className="absolute inset-0 text-fuchsia-400/45 pointer-events-none select-none"
        style={{
          transform: `translate(${chroma}px, ${-chroma * 0.2}px)`,
          mixBlendMode: "screen",
        }}
        aria-hidden
      >
        {words.map((w, i) => (
          <span key={i} className="inline-block mr-[0.25em]">
            {w}
          </span>
        ))}
      </span>

      {words.map((word, i) => {
        const delay = i * (style === "typewriter" ? 0.06 : style === "cascade" ? 0.08 : 0.04);
        const r = seeded(lineIndex + i, 41);

        let initial: Record<string, unknown> = { opacity: 0 };
        let animate: Record<string, unknown> = { opacity: 1 };

        switch (style) {
          case "drop":
            initial = {
              y: -140 - r * 100,
              opacity: 0,
              rotate: -18 + r * 36,
              scale: 0.5,
            };
            animate = {
              y: 0,
              opacity: 1,
              rotate: 0,
              scale: 1,
              transition: {
                type: "spring",
                stiffness: 100 + r * 50,
                damping: 10,
                delay,
              },
            };
            break;
          case "shatter":
            initial = {
              x: (r - 0.5) * 260,
              y: (seeded(lineIndex + i, 43) - 0.5) * 200,
              opacity: 0,
              scale: 0.15,
              rotate: (r - 0.5) * 100,
            };
            animate = {
              x: 0,
              y: 0,
              opacity: 1,
              scale: 1,
              rotate: 0,
              transition: {
                type: "spring",
                stiffness: 80,
                damping: 12,
                delay: i * 0.03,
              },
            };
            break;
          case "bounce":
            initial = { y: 80, opacity: 0, scale: 0.4 };
            animate = {
              y: [80, -26, 0],
              opacity: 1,
              scale: [0.4, 1.22, 1],
              transition: {
                duration: 0.6,
                delay,
                times: [0, 0.55, 1],
                ease: "easeOut",
              },
            };
            break;
          case "wave":
            initial = { y: 55, opacity: 0, rotateX: 50 };
            animate = {
              y: [55, -16, 0],
              opacity: 1,
              rotateX: 0,
              transition: {
                duration: 0.7,
                delay: i * 0.055,
                ease: [0.22, 1, 0.36, 1],
              },
            };
            break;
          case "scale":
            initial = { scale: 0.1, opacity: 0, filter: "blur(20px)" };
            animate = {
              scale: 1,
              opacity: 1,
              filter: "blur(0px)",
              transition: {
                type: "spring",
                stiffness: 120,
                damping: 13,
                delay: i * 0.035,
              },
            };
            break;
          case "typewriter":
            initial = { opacity: 0, y: 10 };
            animate = {
              opacity: 1,
              y: 0,
              transition: { duration: 0.1, delay },
            };
            break;
          case "pulse":
            initial = { scale: 0.3, opacity: 0 };
            animate = {
              scale: [0.3, 1.25, 1],
              opacity: 1,
              transition: {
                duration: 0.55,
                delay: i * 0.05,
                times: [0, 0.5, 1],
                ease: "easeOut",
              },
            };
            break;
          case "cascade":
            initial = { y: -80, opacity: 0, rotateX: -40 };
            animate = {
              y: 0,
              opacity: 1,
              rotateX: 0,
              transition: {
                type: "spring",
                stiffness: 90,
                damping: 14,
                delay: i * 0.09,
              },
            };
            break;
          case "zoom":
            initial = {
              scale: 2.5,
              opacity: 0,
              filter: "blur(12px)",
              z: 80,
            };
            animate = {
              scale: 1,
              opacity: 1,
              filter: "blur(0px)",
              z: 0,
              transition: {
                type: "spring",
                stiffness: 100,
                damping: 15,
                delay: i * 0.04,
              },
            };
            break;
          default:
            initial = { y: 35, opacity: 0, scale: 0.75 };
            animate = {
              y: 0,
              opacity: 1,
              scale: 1,
              transition: {
                type: "spring",
                stiffness: 115,
                damping: 13,
                delay,
              },
            };
        }

        return (
          <motion.span
            key={`${lineIndex}-${i}-${word}`}
            className="inline-block mr-[0.25em] relative z-10"
            style={{
              textShadow: `0 0 ${12 + energy * 28}px rgba(255,255,255,${0.3 + energy * 0.45})`,
            }}
            initial={initial}
            animate={animate}
            exit={{ opacity: 0, y: -25, filter: "blur(8px)" }}
          >
            {word}
          </motion.span>
        );
      })}
    </h1>
  );
}

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
      className="relative text-[1.75rem] leading-tight sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tighter lyric-glow"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.span
        className="absolute inset-0 text-cyan-300 opacity-80"
        style={{ mixBlendMode: "screen" }}
        animate={{
          x: [0, -chroma * 1.6, chroma, -chroma * 0.4, 0],
          y: [0, chroma * 0.35, -chroma * 0.25, 0],
        }}
        transition={{ duration: 0.32, repeat: chaos ? 4 : 1 }}
      >
        {text}
      </motion.span>
      <motion.span
        className="absolute inset-0 text-fuchsia-400 opacity-70"
        style={{ mixBlendMode: "screen" }}
        animate={{
          x: [0, chroma * 1.9, -chroma, chroma * 0.5, 0],
          y: [0, -chroma * 0.4, chroma * 0.25, 0],
        }}
        transition={{
          duration: 0.28,
          repeat: chaos ? 4 : 1,
          delay: 0.03,
        }}
      >
        {text}
      </motion.span>

      <span className="relative z-10">
        {words.map((word, i) => (
          <motion.span
            key={i}
            className="inline-block mr-[0.25em]"
            initial={{
              opacity: 0,
              x: chaos ? (seeded(lineIndex + i, 51) - 0.5) * 90 : 0,
              filter: "blur(6px)",
            }}
            animate={{
              opacity: 1,
              x: 0,
              filter: "blur(0px)",
              transition: { delay: i * 0.035, duration: 0.18 },
            }}
          >
            {word}
          </motion.span>
        ))}
      </span>

      {chaos &&
        [0.22, 0.48, 0.72].map((pos, i) => (
          <motion.span
            key={i}
            className="absolute left-0 right-0 overflow-hidden text-white/90"
            style={{ top: `${pos * 100}%`, height: "16%" }}
            animate={{
              x: [0, (i % 2 === 0 ? 1 : -1) * (14 + chroma * 4), 0],
            }}
            transition={{ duration: 0.18, delay: 0.04 * i, repeat: 3 }}
          >
            <span style={{ transform: `translateY(-${pos * 100}%)` }}>
              {text}
            </span>
          </motion.span>
        ))}
    </motion.h1>
  );
}

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
    <h1 className="text-[1.75rem] leading-none sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tighter lyric-glow">
      {letters.map((char, i) => {
        if (char === " ") {
          return <span key={i} className="inline-block w-[0.28em]" />;
        }
        const r = seeded(lineIndex + i, 61);
        const angle = r * Math.PI * 2;
        const dist = 90 + r * 160;

        return (
          <motion.span
            key={i}
            className="inline-block"
            style={{
              textShadow: `0 0 ${8 + energy * 20}px rgba(255,255,255,0.55)`,
            }}
            initial={{
              x: Math.cos(angle) * dist,
              y: Math.sin(angle) * dist,
              opacity: 0,
              scale: 0.05,
              rotate: (r - 0.5) * 140,
              filter: "blur(10px)",
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
                stiffness: 65 + r * 55,
                damping: 11,
                delay: i * 0.015,
              },
            }}
          >
            {char}
          </motion.span>
        );
      })}
    </h1>
  );
}

function OrbitBlock({ words, lineIndex }: { words: string[]; lineIndex: number }) {
  return (
    <h1 className="text-[1.75rem] leading-tight sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tighter lyric-glow">
      {words.map((word, i) => {
        const r = seeded(lineIndex + i, 71);
        const angle =
          (i / Math.max(words.length, 1)) * Math.PI * 2 + r * 0.5;
        const radius = 140 + r * 100;

        return (
          <motion.span
            key={i}
            className="inline-block mr-[0.25em]"
            initial={{
              x: Math.cos(angle) * radius,
              y: Math.sin(angle) * radius,
              opacity: 0,
              scale: 0.25,
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
                stiffness: 90,
                damping: 13,
                delay: i * 0.045,
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
