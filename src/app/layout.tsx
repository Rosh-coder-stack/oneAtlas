import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/layout/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "OneAtlas — AI Model Discovery & Intelligence Platform",
  description:
    "Explore, analyze, and benchmark frontier AI models, open weights, and neural architectures with real-world evaluations.",
  keywords: [
    "AI Models",
    "LLM Discovery",
    "Model Benchmarks",
    "Open Weights",
    "DeepSeek",
    "Claude",
    "Llama 3",
    "Artificial Intelligence",
  ],
  authors: [{ name: "OneAtlas Engineering" }],
};

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
