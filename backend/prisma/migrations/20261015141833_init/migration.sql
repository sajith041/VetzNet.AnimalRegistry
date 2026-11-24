-- CreateTable
CREATE TABLE "public"."Species" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "nameSi" TEXT,
    "nameTa" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Species_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Owner" (
    "id" SERIAL NOT NULL,
    "fullName" TEXT NOT NULL,
    "nic" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "preferredLang" TEXT NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Owner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Animal" (
    "id" SERIAL NOT NULL,
    "clientUuid" TEXT NOT NULL,
    "speciesId" INTEGER NOT NULL,
    "breed" TEXT,
    "dob" TIMESTAMP(3),
    "sex" TEXT,
    "color" TEXT,
    "photoUrl" TEXT,
    "currentOwnerId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Animal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Microchip" (
    "id" SERIAL NOT NULL,
    "chipNumber" TEXT NOT NULL,
    "isoStandard" TEXT NOT NULL DEFAULT 'ISO_11784',
    "implantDate" TIMESTAMP(3),
    "implantLocation" TEXT,
    "implantedByVetId" INTEGER,
    "animalId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Microchip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Vaccination" (
    "id" SERIAL NOT NULL,
    "clientUuid" TEXT NOT NULL,
    "animalId" INTEGER NOT NULL,
    "vaccineType" TEXT NOT NULL DEFAULT 'RABIES',
    "batchNo" TEXT,
    "manufacturer" TEXT,
    "administeredDate" TIMESTAMP(3) NOT NULL,
    "nextDueDate" TIMESTAMP(3),
    "vetId" INTEGER,
    "certificateUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vaccination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OwnershipHistory" (
    "id" SERIAL NOT NULL,
    "animalId" INTEGER NOT NULL,
    "fromOwnerId" INTEGER NOT NULL,
    "toOwnerId" INTEGER NOT NULL,
    "transferDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transferReason" TEXT,
    "approvedByUserId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OwnershipHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'VET',
    "preferredLang" TEXT NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Species_name_key" ON "public"."Species"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Owner_nic_key" ON "public"."Owner"("nic");

-- CreateIndex
CREATE UNIQUE INDEX "Animal_clientUuid_key" ON "public"."Animal"("clientUuid");

-- CreateIndex
CREATE UNIQUE INDEX "Microchip_chipNumber_key" ON "public"."Microchip"("chipNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Microchip_animalId_key" ON "public"."Microchip"("animalId");

-- CreateIndex
CREATE UNIQUE INDEX "Vaccination_clientUuid_key" ON "public"."Vaccination"("clientUuid");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");

-- AddForeignKey
ALTER TABLE "public"."Animal" ADD CONSTRAINT "Animal_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "public"."Species"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Animal" ADD CONSTRAINT "Animal_currentOwnerId_fkey" FOREIGN KEY ("currentOwnerId") REFERENCES "public"."Owner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Microchip" ADD CONSTRAINT "Microchip_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "public"."Animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Vaccination" ADD CONSTRAINT "Vaccination_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "public"."Animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OwnershipHistory" ADD CONSTRAINT "OwnershipHistory_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "public"."Animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OwnershipHistory" ADD CONSTRAINT "OwnershipHistory_fromOwnerId_fkey" FOREIGN KEY ("fromOwnerId") REFERENCES "public"."Owner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OwnershipHistory" ADD CONSTRAINT "OwnershipHistory_toOwnerId_fkey" FOREIGN KEY ("toOwnerId") REFERENCES "public"."Owner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
