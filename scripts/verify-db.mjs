import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["info", "warn", "error"],
});

async function main() {
  console.log("==================================================");
  console.log("OneAtlas - Real PostgreSQL & Prisma Verification");
  console.log("==================================================");

  try {
    // 1. Test basic connection
    console.log("1. Connecting to PostgreSQL database...");
    await prisma.$connect();
    console.log("   ✓ Successfully established database connection.");

    // 2. Query PostgreSQL engine version
    const versionResult = await prisma.$queryRaw`SELECT version();`;
    const pgVersion = versionResult[0].version;
    console.log(`2. PostgreSQL Engine Version:\n   ${pgVersion}`);

    // 3. Inspect public schema tables
    const tablesResult = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    console.log("3. Tables created by Prisma migrations in 'public' schema:");
    for (const row of tablesResult) {
      console.log(`   - ${row.table_name}`);
    }

    // 4. Test CRUD operations on Prisma Model
    console.log("4. Verifying CRUD lifecycle with Prisma Client...");
    const testSlug = `test-provider-${Date.now()}`;
    const created = await prisma.provider.create({
      data: {
        name: "OneAtlas Verification Lab",
        slug: testSlug,
        websiteUrl: "https://oneatlas.internal",
        isVerified: true,
        description: "Temporary provider created to verify live Prisma DB connection.",
      },
    });
    console.log(`   ✓ CREATE: Inserted Provider (ID: ${created.id}, Slug: ${created.slug})`);

    const read = await prisma.provider.findUnique({
      where: { id: created.id },
    });
    console.log(`   ✓ READ: Retrieved Provider successfully: ${read.name}`);

    await prisma.provider.delete({
      where: { id: created.id },
    });
    console.log("   ✓ DELETE: Cleaned up test record.");

    console.log("\n==================================================");
    console.log("RESULT: ALL DATABASE & PRISMA CHECKS PASSED!");
    console.log("==================================================");
  } catch (error) {
    console.error("Database verification failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
