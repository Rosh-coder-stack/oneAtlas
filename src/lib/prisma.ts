import { PrismaClient } from "@prisma/client";

/**
 * Global Prisma Client singleton for Next.js App Router.
 * Prevents multiple instances of Prisma Client in development hot-reloading,
 * protecting against database connection pool exhaustion.
 */

const prismaClientSingleton = (): PrismaClient => {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton> | undefined;
} & typeof global;

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}

export default prisma;
