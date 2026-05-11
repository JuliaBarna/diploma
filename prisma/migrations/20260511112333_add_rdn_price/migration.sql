-- CreateTable
CREATE TABLE "RdnPrice" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "hour" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "RdnPrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RdnPrice_date_idx" ON "RdnPrice"("date");

-- CreateIndex
CREATE UNIQUE INDEX "RdnPrice_date_hour_key" ON "RdnPrice"("date", "hour");
