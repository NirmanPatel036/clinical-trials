import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import localFont from "next/font/local";

import "./globals.css";

const neutral = localFont({ src: "../polysans-font-family/polysanstrial-neutral.otf", variable: "--font-neutral", weight: "400 600", display: "swap" });
const slim = localFont({ src: "../polysans-font-family/polysanstrial-slim.otf", variable: "--font-slim", weight: "200 400", display: "swap" });
// The kit sets registry data (NCT IDs, chunk ids, fact lines) in Plex Mono.
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Orvant: oncology trial discovery, every reason cited",
  description: "Search oncology trials in plain language and review a patient against each trial one criterion at a time. A review aid, not an eligibility decision.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${neutral.variable} ${slim.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
