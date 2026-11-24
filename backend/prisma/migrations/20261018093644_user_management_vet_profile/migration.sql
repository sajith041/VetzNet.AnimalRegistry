-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "email" TEXT,
ADD COLUMN     "fullName" TEXT,
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "vetId" INTEGER;

-- CreateTable
CREATE TABLE "public"."Vet" (
    "id" SERIAL NOT NULL,
    "fullName" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "clinicName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "district" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Vet_licenseNumber_key" ON "public"."Vet"("licenseNumber");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_vetId_fkey" FOREIGN KEY ("vetId") REFERENCES "public"."Vet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
