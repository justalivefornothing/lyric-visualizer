import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-display",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Lyric Visualizer | Kinetic Typography",
  description:
    "Paste a YouTube or Spotify link (or search) and watch lyrics come alive with After Effects-style animations.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Lyric Visualizer",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#030306",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="font-display antialiased min-h-[100dvh] bg-[#030306] text-white overscroll-none">
        {children}
      </body>
    </html>
  );
}
