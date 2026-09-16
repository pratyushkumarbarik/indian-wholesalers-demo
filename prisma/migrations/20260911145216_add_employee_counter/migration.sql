-- CreateTable
CREATE TABLE "EmployeeCounter" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "nextValue" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeCounter_pkey" PRIMARY KEY ("id")
);
