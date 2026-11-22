import type { Metadata, Viewport } from "next";
import { Archivo, Manrope, DM_Mono } from "next/font/google";
import "./globals.css";

/* Archivo is variable on weight AND width, so one family gives both the ultra-condensed
   display cuts and the wide headline cuts. */
const display = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-display",
  display: "swap",
});
const sans = Manrope({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Self-Healing Quantum ML",
  description:
    "A closed-loop framework that detects, diagnoses and repairs training faults in variational quantum classifiers, with an open counterfactual benchmark across 11 datasets.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2efe8" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0b" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`dark ${display.variable} ${sans.variable} ${mono.variable}`}
      style={{ colorScheme: "dark" }}
      suppressHydrationWarning
    >
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
