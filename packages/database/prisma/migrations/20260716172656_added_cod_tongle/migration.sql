-- AlterTable
ALTER TABLE "AppSettings" ADD COLUMN     "codEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "codMaxOrderValue" DECIMAL(10,2),
ADD COLUMN     "codMinOrderValue" DECIMAL(10,2) NOT NULL DEFAULT 0;
