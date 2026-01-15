-- CreateTable
CREATE TABLE "ClientLog" (
    "id" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "details" JSONB,
    "userId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientLog_pkey" PRIMARY KEY ("id")
);
