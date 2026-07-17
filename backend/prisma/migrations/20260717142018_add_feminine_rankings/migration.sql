-- CreateTable
CREATE TABLE "feminine_rankings" (
    "id" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "points" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isManual" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feminine_rankings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "feminine_rankings_playerName_key" ON "feminine_rankings"("playerName");
