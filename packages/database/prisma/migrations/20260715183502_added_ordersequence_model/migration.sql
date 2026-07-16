-- CreateTable
CREATE TABLE "OrderSequence" (
    "year" INTEGER NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "OrderSequence_pkey" PRIMARY KEY ("year")
);
