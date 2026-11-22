-- AlterTable
ALTER TABLE "model_benchmarks" ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "models" ADD COLUMN     "inputPricePerMillion" DOUBLE PRECISION,
ADD COLUMN     "outputPricePerMillion" DOUBLE PRECISION;
