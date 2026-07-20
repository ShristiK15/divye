/*
  Warnings:

  - Added the required column `shippingCity` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shippingLine1` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shippingName` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shippingPhone` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shippingPincode` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shippingState` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_addressId_fkey";

-- AlterTable
ALTER TABLE "AppSettings" ADD COLUMN     "businessAddress" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "businessHours" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "supportEmail" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "supportPhone" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "supportWhatsapp" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "shippingCity" TEXT NOT NULL,
ADD COLUMN     "shippingLine1" TEXT NOT NULL,
ADD COLUMN     "shippingLine2" TEXT,
ADD COLUMN     "shippingName" TEXT NOT NULL,
ADD COLUMN     "shippingPhone" TEXT NOT NULL,
ADD COLUMN     "shippingPincode" TEXT NOT NULL,
ADD COLUMN     "shippingState" TEXT NOT NULL,
ALTER COLUMN "addressId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;
