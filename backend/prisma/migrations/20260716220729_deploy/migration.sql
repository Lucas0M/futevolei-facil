-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "bracketStyle" TEXT NOT NULL DEFAULT 'DOUBLE_ELIMINATION',
ADD COLUMN     "winnerName" TEXT;

-- AlterTable
ALTER TABLE "registrations" ADD COLUMN     "customPlayerName" TEXT;

-- AlterTable
ALTER TABLE "teams" ADD COLUMN     "customOwnerName" TEXT;

-- CreateTable
CREATE TABLE "matches" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "bracketType" TEXT NOT NULL DEFAULT 'WINNER',
    "competitorAId" TEXT,
    "competitorAName" TEXT,
    "competitorBId" TEXT,
    "competitorBName" TEXT,
    "winnerId" TEXT,
    "score" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "duo_rankings" (
    "id" TEXT NOT NULL,
    "playerAName" TEXT NOT NULL,
    "playerBName" TEXT NOT NULL,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "points" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isManual" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "duo_rankings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "individual_rankings" (
    "id" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "points" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isManual" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "individual_rankings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "players" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "photoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "duo_rankings_playerAName_playerBName_key" ON "duo_rankings"("playerAName", "playerBName");

-- CreateIndex
CREATE UNIQUE INDEX "individual_rankings_playerName_key" ON "individual_rankings"("playerName");

-- CreateIndex
CREATE UNIQUE INDEX "players_name_key" ON "players"("name");

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
