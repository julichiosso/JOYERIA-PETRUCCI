-- CreateTable
CREATE TABLE "store_config" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "storeName" TEXT NOT NULL,
    "whatsappNumber" TEXT NOT NULL,
    "whatsappMessageTemplate" TEXT,
    "instagramUrl" TEXT,
    "facebookUrl" TEXT,
    "address" TEXT,
    "businessHours" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "store_config_tenantId_key" ON "store_config"("tenantId");
