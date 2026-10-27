-- AlterTable
ALTER TABLE "Order" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Order_storeId_deletedAt_idx" ON "Order"("storeId", "deletedAt");
