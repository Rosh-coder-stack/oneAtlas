import { prisma } from "@/lib/prisma";

export async function getProviders() {
  const providers = await prisma.provider.findMany({
    orderBy: { name: "asc" },
    include: {
      models: {
        select: {
          id: true,
          name: true,
          slug: true,
          openWeights: true,
          inputPricePerMillion: true,
          outputPricePerMillion: true,
        },
      },
      _count: {
        select: { models: true },
      },
    },
  });

  return providers.map((p) => {
    const openWeightsCount = p.models.filter((m) => m.openWeights).length;
    const proprietaryCount = p.models.length - openWeightsCount;
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      websiteUrl: p.websiteUrl,
      logoUrl: p.logoUrl,
      description: p.description,
      isVerified: p.isVerified,
      modelsCount: p._count.models,
      openWeightsCount,
      proprietaryCount,
      sampleModels: p.models.slice(0, 3).map((m) => ({
        name: m.name,
        slug: m.slug,
        openWeights: m.openWeights,
      })),
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  });
}

export async function getProviderBySlug(slug: string) {
  const provider = await prisma.provider.findUnique({
    where: { slug },
    include: {
      models: {
        include: {
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
                  maxScore: true,
                },
              },
            },
            orderBy: {
              score: "desc",
            },
          },
        },
        orderBy: { name: "asc" },
      },
      _count: {
        select: { models: true },
      },
    },
  });

  if (!provider) {
    return null;
  }

  // Transform models to match domain ModelDetailItem relational shape
  const models = provider.models.map((m) => ({
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
    provider: {
      id: provider.id,
      name: provider.name,
      slug: provider.slug,
      logoUrl: provider.logoUrl,
      websiteUrl: provider.websiteUrl,
      isVerified: provider.isVerified,
    },
    categories: m.categories.map((c) => ({
      id: c.category.id,
      name: c.category.name,
      slug: c.category.slug,
      description: c.category.description,
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
      evaluatedAt: b.evaluatedAt,
    })),
  }));

  const openWeightsCount = models.filter((m) => m.openWeights).length;
  const proprietaryCount = models.length - openWeightsCount;

  // Aggregate categories present across this provider's catalog
  const categoriesMap = new Map<string, { id: string; name: string; slug: string; count: number }>();
  for (const m of models) {
    for (const c of m.categories) {
      if (!categoriesMap.has(c.slug)) {
        categoriesMap.set(c.slug, { id: c.id, name: c.name, slug: c.slug, count: 1 });
      } else {
        categoriesMap.get(c.slug)!.count++;
      }
    }
  }

  // Aggregate pricing statistics
  const validInputs = models
    .map((m) => m.inputPricePerMillion)
    .filter((p): p is number => p !== null && p !== undefined);
  const validOutputs = models
    .map((m) => m.outputPricePerMillion)
    .filter((p): p is number => p !== null && p !== undefined);

  const minInputPrice = validInputs.length > 0 ? Math.min(...validInputs) : null;
  const maxInputPrice = validInputs.length > 0 ? Math.max(...validInputs) : null;
  const minOutputPrice = validOutputs.length > 0 ? Math.min(...validOutputs) : null;
  const maxOutputPrice = validOutputs.length > 0 ? Math.max(...validOutputs) : null;

  // Flatten and dedup top benchmark scores achieved across all models of this provider
  const topBenchmarkScores: Array<{
    benchmarkSlug: string;
    benchmarkName: string;
    modelName: string;
    modelSlug: string;
    score: number;
    maxScore: number;
    isVerified: boolean;
  }> = [];

  const seenBenchmarks = new Set<string>();
  const allScores = models
    .flatMap((m) =>
      m.benchmarks.map((b) => ({
        benchmarkSlug: b.slug,
        benchmarkName: b.name,
        modelName: m.name,
        modelSlug: m.slug,
        score: b.score,
        maxScore: b.maxScore,
        isVerified: b.isVerified,
      }))
    )
    .sort((a, b) => b.score - a.score);

  for (const item of allScores) {
    if (!seenBenchmarks.has(item.benchmarkSlug)) {
      seenBenchmarks.add(item.benchmarkSlug);
      topBenchmarkScores.push(item);
    }
  }

  return {
    id: provider.id,
    name: provider.name,
    slug: provider.slug,
    websiteUrl: provider.websiteUrl,
    logoUrl: provider.logoUrl,
    description: provider.description,
    isVerified: provider.isVerified,
    modelsCount: provider._count.models,
    openWeightsCount,
    proprietaryCount,
    categories: Array.from(categoriesMap.values()),
    pricingSummary: {
      minInputPrice,
      maxInputPrice,
      minOutputPrice,
      maxOutputPrice,
      hasFreeTier: minInputPrice === 0 || openWeightsCount > 0,
    },
    topBenchmarkScores,
    models,
    createdAt: provider.createdAt,
    updatedAt: provider.updatedAt,
  };
}
