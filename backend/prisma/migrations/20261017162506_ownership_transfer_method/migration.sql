-- AlterTable
ALTER TABLE "public"."OwnershipHistory" ADD COLUMN     "method" TEXT NOT NULL DEFAULT 'DIRECT',
ADD COLUMN     "transferCode" TEXT;
