-- AlterTable
ALTER TABLE "public"."Animal" ADD COLUMN     "name" TEXT;

-- AlterTable
ALTER TABLE "public"."Owner" ADD COLUMN     "contactPerson" TEXT,
ADD COLUMN     "ownerType" TEXT NOT NULL DEFAULT 'PERSON',
ADD COLUMN     "registrationNumber" TEXT;
