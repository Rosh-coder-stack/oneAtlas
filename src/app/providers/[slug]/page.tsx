import * as React from "react";
import type { Metadata } from "next";
import { getProviderBySlug } from "@/services/provider.service";
import { ProviderDetailView } from "@/components/modules/ProviderDetailView";

export const instant = false;

interface ProviderPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProviderPageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!slug) {
    return {
      title: "AI Provider Profile | OneAtlas",
      description: "AI research lab models, pricing, and benchmark intelligence.",
    };
  }

  const provider = await getProviderBySlug(slug);

  if (!provider) {
    return {
      title: "Provider Not Found | OneAtlas",
      description: `The AI Provider with slug "${slug}" could not be found in the OneAtlas registry.`,
    };
  }

  const title = `${provider.name} — AI Models, Pricing & Benchmark Intel | OneAtlas`;
  const description =
    provider.description ||
    `${provider.name} foundation models catalog, architecture specs, unit economics, and verified benchmark evaluations.`;

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

export default async function ProviderDetailPage({ params }: ProviderPageProps) {
  const { slug } = await params;

  return <ProviderDetailView slug={slug} />;
}
