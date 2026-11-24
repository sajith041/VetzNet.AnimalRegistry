-- AlterTable
ALTER TABLE "public"."Owner" ADD COLUMN     "authorityCode" TEXT,
ADD COLUMN     "verificationStatus" TEXT NOT NULL DEFAULT 'VERIFIED';
