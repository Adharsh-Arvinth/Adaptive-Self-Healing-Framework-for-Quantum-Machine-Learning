import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Adaptive Self-Healing Quantum ML | Autonomous VQC Research Platform",
  description:
    "Autonomous closed-loop runtime self-healing architecture for Variational Quantum Classifiers (VQCs). Real-time telemetry, Bayesian root-cause diagnosis, Contextual Thompson Sampling, digital-twin validation, and atomic rollback recovery.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-bg-primary text-content-primary selection:bg-accent/20 selection:text-content-primary`}
      >
        {children}
      </body>
    </html>
  );
}
