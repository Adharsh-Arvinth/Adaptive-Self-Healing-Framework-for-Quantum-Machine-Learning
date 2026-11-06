import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Adaptive Self-Healing Quantum ML | Autonomous VQC Research Platform",
  description:
    "Autonomous closed-loop runtime self-healing architecture for Variational Quantum Classifiers (VQCs). Real-time telemetry, Bayesian root-cause diagnosis, Contextual Thompson Sampling, digital-twin validation, and atomic rollback recovery.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: "dark" }} suppressHydrationWarning>
      <body
        className="antialiased min-h-screen bg-bg-primary text-content-primary selection:bg-accent/20 selection:text-content-primary"
      >
        {children}
      </body>
    </html>
  );
}
