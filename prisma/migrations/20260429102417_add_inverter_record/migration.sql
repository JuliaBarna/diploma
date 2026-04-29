-- CreateTable
CREATE TABLE "InverterRecord" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "statisticalPeriod" TEXT NOT NULL,
    "globalIrradiation" DOUBLE PRECISION NOT NULL,
    "avgTemperature" DOUBLE PRECISION NOT NULL,
    "theoreticalYield" DOUBLE PRECISION NOT NULL,
    "pvYield" DOUBLE PRECISION NOT NULL,
    "inverterYield" DOUBLE PRECISION NOT NULL,
    "export" DOUBLE PRECISION NOT NULL,
    "import" DOUBLE PRECISION NOT NULL,
    "lossExportKwh" DOUBLE PRECISION NOT NULL,
    "lossExportEur" DOUBLE PRECISION NOT NULL,
    "charge" DOUBLE PRECISION NOT NULL,
    "discharge" DOUBLE PRECISION NOT NULL,
    "revenue" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "InverterRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InverterRecord_timestamp_idx" ON "InverterRecord"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "InverterRecord_timestamp_key" ON "InverterRecord"("timestamp");
