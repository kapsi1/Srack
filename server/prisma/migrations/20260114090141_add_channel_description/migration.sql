-- AlterTable
ALTER TABLE "Channel" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "_ChannelToUser" ADD CONSTRAINT "_ChannelToUser_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_ChannelToUser_AB_unique";
