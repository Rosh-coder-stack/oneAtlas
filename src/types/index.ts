/**
 * OneAtlas - AI Model Discovery and Intelligence Platform
 * Core Domain TypeScript Type Definitions
 */

export type ModelLicenseType = "Open Weights" | "Proprietary" | "Research Only";

export type ModelCategoryType =
  | "General LLM"
  | "Multimodal"
  | "Reasoning & Math"
  | "Code Generation"
  | "Embedding"
  | "Audio & Speech"
  | "Small & Edge Models";

export interface BenchmarkScore {
  benchmarkId: string;
  name: string;
  score: number;
  maxScore: number;
  category: "Reasoning" | "Coding" | "Knowledge" | "Safety" | "Vision" | string;
  sourceUrl?: string;
  isVerified?: boolean;
  notes?: string | null;
}

export interface AIModel {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  provider: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string;
    verified: boolean;
  };
  category: ModelCategoryType;
  architecture: string;
  parametersCount: string;
  activeParameters?: string;
  contextWindow: number; // In tokens
  license: string;
  licenseType: ModelLicenseType;
  openWeights: boolean;
  releaseDate: string; // ISO date string
  isFeatured: boolean;
  documentationUrl?: string | null;
  huggingFaceUrl?: string | null;
  inputPricePerMillion?: number | null;
  outputPricePerMillion?: number | null;
  benchmarks: BenchmarkScore[];
  badges?: string[];
}

export interface NavigationItem {
  name: string;
  href: string;
  iconName: "discovery" | "benchmarks" | "arena" | "providers" | "docs" | "settings";
  count?: number;
  isExternal?: boolean;
}

export interface IntelligenceMetric {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
  description: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiProviderItem {
  id: string;
  name: string;
  slug: string;
  websiteUrl: string | null;
  logoUrl: string | null;
  description: string | null;
  isVerified: boolean;
  modelsCount: number;
  openWeightsCount?: number;
  proprietaryCount?: number;
  sampleModels?: Array<{ name: string; slug: string; openWeights: boolean }>;
}

export interface ProviderPricingSummary {
  minInputPrice: number | null;
  maxInputPrice: number | null;
  minOutputPrice: number | null;
  maxOutputPrice: number | null;
  hasFreeTier: boolean;
}

export interface ProviderTopBenchmarkScore {
  benchmarkSlug: string;
  benchmarkName: string;
  modelName: string;
  modelSlug: string;
  score: number;
  maxScore: number;
  isVerified: boolean;
}

export interface ProviderDetailItem {
  id: string;
  name: string;
  slug: string;
  websiteUrl: string | null;
  logoUrl: string | null;
  description: string | null;
  isVerified: boolean;
  modelsCount: number;
  openWeightsCount: number;
  proprietaryCount: number;
  categories: Array<{ id: string; name: string; slug: string; count: number }>;
  pricingSummary: ProviderPricingSummary;
  topBenchmarkScores: ProviderTopBenchmarkScore[];
  models: ModelDetailItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiCategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  modelsCount: number;
}

export interface ModelDetailBenchmark {
  id: string;
  benchmarkId: string;
  name: string;
  slug: string;
  category: string | null;
  description: string | null;
  score: number;
  maxScore: number;
  isVerified: boolean;
  notes: string | null;
  evaluatedAt?: string | null;
}

export interface ModelDetailItem {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  architecture: string | null;
  parametersCount: string | null;
  contextWindow: number | null;
  license: string | null;
  openWeights: boolean;
  releaseDate: string | null;
  status: string;
  isFeatured: boolean;
  documentationUrl: string | null;
  huggingFaceUrl: string | null;
  inputPricePerMillion: number | null;
  outputPricePerMillion: number | null;
  createdAt?: string;
  updatedAt?: string;
  provider: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    websiteUrl: string | null;
    description: string | null;
    isVerified: boolean;
  };
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
  }>;
  benchmarks: ModelDetailBenchmark[];
}
