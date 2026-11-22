import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export interface GetModelsParams {
  search?: string;
  provider?: string;
  category?: string;
  license?: string;
  openWeights?: boolean;
  sortBy?: "input_price" | "output_price" | "context_window" | "release_date" | "name" | "created_at";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface ModelListItem {
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
  releaseDate: Date | null;
  status: string;
  isFeatured: boolean;
  documentationUrl: string | null;
  huggingFaceUrl: string | null;
  inputPricePerMillion: number | null;
  outputPricePerMillion: number | null;
  createdAt: Date;
  updatedAt: Date;
  provider: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    websiteUrl: string | null;
    isVerified: boolean;
  };
  categories: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  benchmarks: Array<{
    id: string;
    benchmarkId: string;
    name: string;
    slug: string;
    category: string | null;
    score: number;
    maxScore: number;
    isVerified: boolean;
    notes: string | null;
  }>;
}

export async function getModels(params: GetModelsParams) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(50, Math.max(1, params.limit || 10));
  const skip = (page - 1) * limit;

  // Build where clause
  const where: Prisma.ModelWhereInput = {};

  // Search by model name or tagline (case-insensitive)
  if (params.search && params.search.trim()) {
    const searchTrimmed = params.search.trim();
    where.OR = [
      { name: { contains: searchTrimmed, mode: "insensitive" } },
      { tagline: { contains: searchTrimmed, mode: "insensitive" } },
    ];
  }

  // Filter by provider (matches slug or id)
  if (params.provider && params.provider.trim()) {
    const providerQuery = params.provider.trim();
    where.provider = {
      OR: [
        { slug: { equals: providerQuery, mode: "insensitive" } },
        { id: providerQuery },
        { name: { contains: providerQuery, mode: "insensitive" } },
      ],
    };
  }

  // Filter by category (matches slug or id)
  if (params.category && params.category.trim()) {
    const categoryQuery = params.category.trim();
    where.categories = {
      some: {
        category: {
          OR: [
            { slug: { equals: categoryQuery, mode: "insensitive" } },
            { id: categoryQuery },
            { name: { contains: categoryQuery, mode: "insensitive" } },
          ],
        },
      },
    };
  }

  // Filter by license
  if (params.license && params.license.trim()) {
    const licenseQuery = params.license.trim().toLowerCase();
    if (licenseQuery === "open" || licenseQuery === "open-weights" || licenseQuery === "open weights") {
      where.openWeights = true;
    } else if (licenseQuery === "proprietary" || licenseQuery === "closed") {
      where.openWeights = false;
    } else {
      where.license = { contains: params.license.trim(), mode: "insensitive" };
    }
  }

  // Filter by explicit openWeights boolean if supplied
  if (params.openWeights !== undefined) {
    where.openWeights = params.openWeights;
  }

  // Build orderBy clause
  const sortOrder: Prisma.SortOrder = params.sortOrder === "asc" ? "asc" : "desc";
  let orderBy: Prisma.ModelOrderByWithRelationInput;

  switch (params.sortBy) {
    case "input_price":
      orderBy = { inputPricePerMillion: { sort: sortOrder, nulls: "last" } };
      break;
    case "output_price":
      orderBy = { outputPricePerMillion: { sort: sortOrder, nulls: "last" } };
      break;
    case "context_window":
      orderBy = { contextWindow: { sort: sortOrder, nulls: "last" } };
      break;
    case "release_date":
      orderBy = { releaseDate: { sort: sortOrder, nulls: "last" } };
      break;
    case "name":
      orderBy = { name: sortOrder };
      break;
    case "created_at":
    default:
      orderBy = { createdAt: sortOrder };
      break;
  }

  // Execute count and query concurrently to avoid N+1 and minimize latency
  const [total, rawModels] = await Promise.all([
    prisma.model.count({ where }),
    prisma.model.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            websiteUrl: true,
            isVerified: true,
          },
        },
        categories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        benchmarkScores: {
          include: {
            benchmark: {
              select: {
                id: true,
                name: true,
                slug: true,
                category: true,
                maxScore: true,
              },
            },
          },
          orderBy: {
            score: "desc",
          },
        },
      },
    }),
  ]);

  // Transform relational shape for clean REST presentation
  const models: ModelListItem[] = rawModels.map((m) => ({
    id: m.id,
    name: m.name,
    slug: m.slug,
    tagline: m.tagline,
    description: m.description,
    architecture: m.architecture,
    parametersCount: m.parametersCount,
    contextWindow: m.contextWindow,
    license: m.license,
    openWeights: m.openWeights,
    releaseDate: m.releaseDate,
    status: m.status,
    isFeatured: m.isFeatured,
    documentationUrl: m.documentationUrl,
    huggingFaceUrl: m.huggingFaceUrl,
    inputPricePerMillion: m.inputPricePerMillion,
    outputPricePerMillion: m.outputPricePerMillion,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
    provider: m.provider,
    categories: m.categories.map((c) => ({
      id: c.category.id,
      name: c.category.name,
      slug: c.category.slug,
    })),
    benchmarks: m.benchmarkScores.map((b) => ({
      id: b.id,
      benchmarkId: b.benchmarkId,
      name: b.benchmark.name,
      slug: b.benchmark.slug,
      category: b.benchmark.category,
      score: b.score,
      maxScore: b.benchmark.maxScore,
      isVerified: b.isVerified,
      notes: b.notes,
    })),
  }));

  const totalPages = Math.ceil(total / limit);

  return {
    models,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

export async function getModelBySlug(slug: string) {
  const model = await prisma.model.findUnique({
    where: { slug },
    include: {
      provider: {
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          websiteUrl: true,
          description: true,
          isVerified: true,
        },
      },
      categories: {
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
            },
          },
        },
      },
      benchmarkScores: {
        include: {
          benchmark: {
            select: {
              id: true,
              name: true,
              slug: true,
              category: true,
              description: true,
              maxScore: true,
            },
          },
        },
        orderBy: {
          score: "desc",
        },
      },
    },
  });

  if (!model) {
    return null;
  }

  return {
    id: model.id,
    name: model.name,
    slug: model.slug,
    tagline: model.tagline,
    description: model.description,
    architecture: model.architecture,
    parametersCount: model.parametersCount,
    contextWindow: model.contextWindow,
    license: model.license,
    openWeights: model.openWeights,
    releaseDate: model.releaseDate,
    status: model.status,
    isFeatured: model.isFeatured,
    documentationUrl: model.documentationUrl,
    huggingFaceUrl: model.huggingFaceUrl,
    inputPricePerMillion: model.inputPricePerMillion,
    outputPricePerMillion: model.outputPricePerMillion,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
    provider: model.provider,
    categories: model.categories.map((c) => ({
      id: c.category.id,
      name: c.category.name,
      slug: c.category.slug,
      description: c.category.description,
    })),
    benchmarks: model.benchmarkScores.map((b) => ({
      id: b.id,
      benchmarkId: b.benchmarkId,
      name: b.benchmark.name,
      slug: b.benchmark.slug,
      category: b.benchmark.category,
      description: b.benchmark.description,
      score: b.score,
      maxScore: b.benchmark.maxScore,
      isVerified: b.isVerified,
      notes: b.notes,
      evaluatedAt: b.evaluatedAt,
    })),
  };
}
