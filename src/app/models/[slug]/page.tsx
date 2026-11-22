import * as React from "react";
import type { Metadata } from "next";
import { getModelBySlug } from "@/services/model.service";
import { ModelDetailView } from "@/components/modules/ModelDetailView";

export const instant = false;

interface ModelPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ModelPageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!slug) {
    return {
      title: "Model Intelligence | OneAtlas",
      description: "AI model architecture, pricing, and benchmark intelligence.",
    };
  }

  const model = await getModelBySlug(slug);

  if (!model) {
    return {
      title: "Model Not Found | OneAtlas",
      description: `The AI model with slug "${slug}" could not be found in the OneAtlas registry.`,
    };
  }

  const title = `${model.name} — Architecture, Pricing & Benchmark Intel | OneAtlas`;
  const description =
    model.tagline ||
    model.description ||
    `${model.name} foundation model developed by ${model.provider.name}. Complete specifications, unit economics, and benchmark performance.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "OneAtlas",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function ModelDetailPage({ params }: ModelPageProps) {
  const { slug } = await params;

  return (
    <React.Suspense
      fallback={
        <div className="py-20 text-center text-slate-400 space-y-3">
          <div className="h-8 w-8 mx-auto border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Retrieving foundation model intelligence...</p>
        </div>
      }
    >
      <ModelDetailView slug={slug} />
    </React.Suspense>
  );
}
