/*
  Warnings:

  - You are about to drop the column `tournamentId` on the `registrations` table. All the data in the column will be lost.
  - You are about to drop the column `tournamentId` on the `teams` table. All the data in the column will be lost.
  - You are about to drop the column `cancellationDeadlineHours` on the `tournaments` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `tournaments` table. All the data in the column will be lost.
  - You are about to drop the column `entryFee` on the `tournaments` table. All the data in the column will be lost.
  - You are about to drop the column `format` on the `tournaments` table. All the data in the column will be lost.
  - You are about to drop the column `maxSlots` on the `tournaments` table. All the data in the column will be lost.
  - You are about to drop the column `refundFullBeforeDays` on the `tournaments` table. All the data in the column will be lost.
  - You are about to drop the column `refundPartialBeforeDays` on the `tournaments` table. All the data in the column will be lost.
  - You are about to drop the column `refundPartialPercent` on the `tournaments` table. All the data in the column will be lost.
  - You are about to drop the column `registrationDeadline` on the `tournaments` table. All the data in the column will be lost.
  - You are about to drop the column `reservationTtlMinutes` on the `tournaments` table. All the data in the column will be lost.
  - The `status` column on the `tournaments` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[categoryId,userId]` on the table `registrations` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[categoryId,ownerUserId]` on the table `teams` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `categoryId` to the `registrations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `categoryId` to the `teams` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CategoryFormat" AS ENUM ('INDIVIDUAL', 'DUO_FIXED', 'DUO_RANDOM');

-- CreateEnum
CREATE TYPE "EntityStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'REGISTRATIONS_CLOSED', 'CANCELLED', 'FINISHED');

-- DropForeignKey
ALTER TABLE "registrations" DROP CONSTRAINT "registrations_tournamentId_fkey";

-- DropForeignKey
ALTER TABLE "teams" DROP CONSTRAINT "teams_tournamentId_fkey";

-- DropIndex
DROP INDEX "registrations_tournamentId_status_idx";

-- DropIndex
DROP INDEX "registrations_tournamentId_userId_key";

-- DropIndex
DROP INDEX "teams_tournamentId_ownerUserId_key";

-- DropIndex
DROP INDEX "teams_tournamentId_status_idx";

-- AlterTable
ALTER TABLE "registrations" DROP COLUMN "tournamentId",
ADD COLUMN     "categoryId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "teams" DROP COLUMN "tournamentId",
ADD COLUMN     "categoryId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "tournaments" DROP COLUMN "cancellationDeadlineHours",
DROP COLUMN "category",
DROP COLUMN "entryFee",
DROP COLUMN "format",
DROP COLUMN "maxSlots",
DROP COLUMN "refundFullBeforeDays",
DROP COLUMN "refundPartialBeforeDays",
DROP COLUMN "refundPartialPercent",
DROP COLUMN "registrationDeadline",
DROP COLUMN "reservationTtlMinutes",
DROP COLUMN "status",
ADD COLUMN     "status" "EntityStatus" NOT NULL DEFAULT 'DRAFT';

-- DropEnum
DROP TYPE "TournamentFormat";

-- DropEnum
DROP TYPE "TournamentStatus";

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "format" "CategoryFormat" NOT NULL,
    "entryFee" DECIMAL(10,2) NOT NULL,
    "maxSlots" INTEGER NOT NULL,
    "registrationDeadline" TIMESTAMP(3) NOT NULL,
    "reservationTtlMinutes" INTEGER NOT NULL DEFAULT 20,
    "refundFullBeforeDays" INTEGER,
    "refundPartialBeforeDays" INTEGER,
    "refundPartialPercent" DECIMAL(5,2),
    "cancellationDeadlineHours" INTEGER NOT NULL DEFAULT 48,
    "status" "EntityStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "categories_tournamentId_status_idx" ON "categories"("tournamentId", "status");

-- CreateIndex
CREATE INDEX "registrations_categoryId_status_idx" ON "registrations"("categoryId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "registrations_categoryId_userId_key" ON "registrations"("categoryId", "userId");

-- CreateIndex
CREATE INDEX "teams_categoryId_status_idx" ON "teams"("categoryId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "teams_categoryId_ownerUserId_key" ON "teams"("categoryId", "ownerUserId");

-- CreateIndex
CREATE INDEX "tournaments_status_eventDate_idx" ON "tournaments"("status", "eventDate");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
