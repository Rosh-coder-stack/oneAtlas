import * as React from "react";
import type { Metadata } from "next";
import { ProvidersDirectoryView } from "@/components/modules/ProvidersDirectoryView";

export const instant = false;

export const metadata: Metadata = {
  title: "AI Providers & Research Labs Directory | OneAtlas",
  description:
    "Comprehensive directory of foundation model research labs, frontier neural network creators, and open-source intelligence organizations (OpenAI, Anthropic, Google DeepMind, Meta AI, DeepSeek, Mistral AI).",
  openGraph: {
    title: "AI Providers & Research Labs Directory | OneAtlas",
    description:
      "Explore foundation model creators and research organizations with specs, model counts, and verified benchmarks.",
    type: "website",
    siteName: "OneAtlas",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Providers & Research Labs Directory | OneAtlas",
    description: "Explore AI providers and frontier model research organizations.",
  },
};

export default function ProvidersPage() {
  return <ProvidersDirectoryView />;
}
