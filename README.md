# Lyric Visualizer 🎵✨

**Kinetic typography lyrics** that feel like heavy After Effects edits — ball-drop, shatter, bounce, glitch, wave, scale, typewriter, and random modes.

Paste a **YouTube link** or type `Song Name - Artist`, hit Go, and the lyrics animate in sync while the track plays.

## Features

- 🎬 Multiple AE-style lyric animations (Drop, Shatter, Bounce, Glitch, Wave, Scale, Typewriter, Random)
- 🔍 Search by title/artist **or** paste a YouTube URL
- ⏱️ Synced lyrics from [LRCLIB](https://lrclib.net) (free, no API key)
- ▶️ YouTube playback via `react-player`
- 🎛️ Full controls: play/pause, seek, volume, style switcher
- 🌙 Dark cinematic UI, ready for Vercel

## Quick Start (local)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy on Vercel

1. Push this repo (already private on your account).
2. Go to [vercel.com/new](https://vercel.com/new) → Import the `lyric-visualizer` repository.
3. Framework preset: **Next.js** (auto-detected).
4. Deploy. No environment variables required.

That’s it. Your live URL will be something like `https://lyric-visualizer-xxx.vercel.app`.

## How it works

1. You enter a YouTube URL or a search query (`Blinding Lights - The Weeknd`).
2. The app extracts title/artist (via YouTube oEmbed for links).
3. Lyrics + timing are fetched from LRCLIB’s public API.
4. `react-player` plays the YouTube video (hidden/small player).
5. Current playback time drives the active lyric line + Framer Motion animations.

## Limitations (honest)

- **Spotify links**: Currently redirected to “use YouTube or search” because reliable metadata + audio without a Spotify API key is hard. You can still search the same song by name.
- Lyrics quality depends on LRCLIB’s crowdsourced data. Some songs may only have plain (unsynced) lyrics — the app approximates timing in that case.
- YouTube embeds can be blocked by the uploader or by region; try another official audio upload if that happens.

## Tech stack

- Next.js 14 (App Router)
- TypeScript + Tailwind CSS
- Framer Motion (animations)
- react-player (YouTube)
- LRCLIB (lyrics)

## License

MIT — do whatever you want with it.

---

Made for the vibes. Drop a link and watch the words fall apart.
