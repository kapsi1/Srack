-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'CALL', 'SYSTEM');

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "type" "MessageType" NOT NULL DEFAULT 'TEXT';
