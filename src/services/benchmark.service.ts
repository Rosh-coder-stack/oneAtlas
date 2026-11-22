import { prisma } from "@/lib/prisma";

export interface GetBenchmarksOptions {
  slug?: string;
  category?: string;
  includeAllScores?: boolean;
}

export async function getBenchmarks(options: GetBenchmarksOptions = {}) {
  const { slug, category, includeAllScores = false } = options;

  const where: {
    slug?: string;
    category?: { contains: string; mode: "insensitive" };
  } = {};

  if (slug) {
    where.slug = slug.toLowerCase();
  }

  if (category && category !== "all" && category !== "overall") {
    where.category = { contains: category, mode: "insensitive" };
  }

  const benchmarks = await prisma.benchmark.findMany({
    where,
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { scores: true },
      },
      scores: {
        include: {
          model: {
            select: {
              id: true,
              name: true,
              slug: true,
              tagline: true,
              openWeights: true,
              architecture: true,
              parametersCount: true,
              contextWindow: true,
              inputPricePerMillion: true,
              outputPricePerMillion: true,
              documentationUrl: true,
              huggingFaceUrl: true,
              provider: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  logoUrl: true,
                  isVerified: true,
                },
              },
            },
          },
        },
        orderBy: {
          score: "desc",
        },
        ...(includeAllScores ? {} : { take: 3 }),
      },
    },
  });

  return benchmarks.map((b) => {
    const scoresSorted = [...b.scores].sort((x, y) => y.score - x.score);

    return {
      id: b.id,
      name: b.name,
      slug: b.slug,
      category: b.category,
      description: b.description,
      maxScore: b.maxScore,
      evaluatedModelsCount: b._count.scores,
      topPerformers: scoresSorted.slice(0, 3).map((s) => ({
        score: s.score,
        modelName: s.model.name,
        modelSlug: s.model.slug,
        isVerified: s.isVerified,
        notes: s.notes,
      })),
      rankings: scoresSorted.map((s, idx) => ({
        rank: idx + 1,
        score: s.score,
        isVerified: s.isVerified,
        notes: s.notes,
        sourceUrl: s.sourceUrl,
        evaluatedAt: s.evaluatedAt,
        model: {
          id: s.model.id,
          name: s.model.name,
          slug: s.model.slug,
          tagline: s.model.tagline,
          openWeights: s.model.openWeights,
          architecture: s.model.architecture,
          parametersCount: s.model.parametersCount,
          contextWindow: s.model.contextWindow,
          inputPricePerMillion: s.model.inputPricePerMillion,
          outputPricePerMillion: s.model.outputPricePerMillion,
          documentationUrl: s.model.documentationUrl,
          huggingFaceUrl: s.model.huggingFaceUrl,
          provider: s.model.provider,
        },
      })),
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
    };
  });
}
