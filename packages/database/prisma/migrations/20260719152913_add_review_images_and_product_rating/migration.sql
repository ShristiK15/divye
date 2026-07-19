-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "avgRating" DECIMAL(2,1) NOT NULL DEFAULT 0,
ADD COLUMN     "reviewCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ReviewImage" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ReviewImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReviewImage_reviewId_idx" ON "ReviewImage"("reviewId");

-- AddForeignKey
ALTER TABLE "ReviewImage" ADD CONSTRAINT "ReviewImage_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;
