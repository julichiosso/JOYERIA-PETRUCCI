/*
  Warnings:

  - You are about to drop the column `available` on the `products` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'DRAFT', 'OUT_OF_STOCK');

-- AlterTable
ALTER TABLE "products" DROP COLUMN "available",
ADD COLUMN     "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
ALTER COLUMN "price" DROP NOT NULL;
