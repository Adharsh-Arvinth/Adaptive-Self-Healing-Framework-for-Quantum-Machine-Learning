import { PAPER_TITLE } from "./paper";
import type { Metadata, Viewport } from "next";
import {
  Archivo,
  Big_Shoulders_Display,
  DM_Mono,
  Fraunces,
  Instrument_Sans,
  Inter,
  Inter_Tight,
  Manrope,
  Space_Grotesk,
  Space_Mono,
  Unbounded,
} from "next/font/google";
import "./globals.css";
import { AppearanceProvider } from "@/components/appearance/AppearanceProvider";
import { prePaintScript } from "@/components/appearance/palettes";

/* Default type system ("Racing"), preloaded:
   Big Shoulders Display (condensed signage) · Archivo (wide) · Instrument Sans (text) · DM Mono (labels) */
const bigShoulders = Big_Shoulders_Display({ subsets: ["latin"], variable: "--ff-bigshoulders", display: "swap" });
const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--ff-archivo", display: "swap" });
const instrument = Instrument_Sans({ subsets: ["latin"], variable: "--ff-instrument", display: "swap" });
const dmMono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--ff-dmmono", display: "swap" });

/* Alternate typefaces for Settings → Appearance. Not preloaded: files download only if chosen. */
const interTight = Inter_Tight({ subsets: ["latin"], variable: "--ff-intertight", display: "swap", preload: false });
const inter = Inter({ subsets: ["latin"], variable: "--ff-inter", display: "swap", preload: false });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--ff-fraunces", display: "swap", preload: false });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--ff-spacegrotesk", display: "swap", preload: false });
const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--ff-spacemono", display: "swap", preload: false });
const unbounded = Unbounded({ subsets: ["latin"], variable: "--ff-unbounded", display: "swap", preload: false });
const manrope = Manrope({ subsets: ["latin"], variable: "--ff-manrope", display: "swap", preload: false });

const fontVars = [bigShoulders, archivo, instrument, dmMono, interTight, inter, fraunces, spaceGrotesk, spaceMono, unbounded, manrope]
  .map((f) => f.variable)
  .join(" ");

export const metadata: Metadata = {
  title: PAPER_TITLE,
  description:
    "A closed-loop framework that detects, diagnoses and repairs training faults in variational quantum classifiers, with an open counterfactual benchmark across 11 datasets.",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f4f1ea",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={fontVars} data-palette="scuderia" data-font="racing" style={{ colorScheme: "light" }} suppressHydrationWarning>
      <head>
        {/* Applies the visitor's saved appearance before first paint (no flash of the wrong theme). */}
        <script dangerouslySetInnerHTML={{ __html: prePaintScript() }} />
      </head>
      <body className="antialiased min-h-screen">
        <AppearanceProvider>{children}</AppearanceProvider>
      </body>
    </html>
  );
}
