/*
  Warnings:

  - A unique constraint covering the columns `[tenantId,slug]` on the table `categories` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "categories" DROP CONSTRAINT "categories_parentId_fkey";

-- DropIndex
DROP INDEX "categories_slug_key";

-- CreateIndex
CREATE INDEX "categories_tenantId_isActive_idx" ON "categories"("tenantId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "categories_tenantId_slug_key" ON "categories"("tenantId", "slug");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
