/*
  Warnings:

  - You are about to drop the column `clinicName` on the `Vet` table. All the data in the column will be lost.
  - You are about to drop the column `licenseNumber` on the `Vet` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slvcRegNo]` on the table `Vet` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slvcRegNo` to the `Vet` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."Vet_licenseNumber_key";

-- AlterTable
ALTER TABLE "public"."Vet" DROP COLUMN "clinicName",
DROP COLUMN "licenseNumber",
ADD COLUMN     "employmentType" TEXT NOT NULL DEFAULT 'PRIVATE',
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "slvcRegNo" TEXT NOT NULL,
ADD COLUMN     "workplace" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Vet_slvcRegNo_key" ON "public"."Vet"("slvcRegNo");
