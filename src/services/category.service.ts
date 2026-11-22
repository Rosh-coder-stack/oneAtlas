import { prisma } from "@/lib/prisma";

export async function getCategories() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { models: true },
      },
    },
  });

  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    modelsCount: c._count.models,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }));
}
