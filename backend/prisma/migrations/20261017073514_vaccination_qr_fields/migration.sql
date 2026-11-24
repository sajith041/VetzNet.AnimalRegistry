-- AlterTable
ALTER TABLE "public"."Vaccination" ADD COLUMN     "expiryDate" TIMESTAMP(3),
ADD COLUMN     "stickerQr" TEXT;
