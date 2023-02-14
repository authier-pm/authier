-- DropForeignKey
ALTER TABLE "WebInput" DROP CONSTRAINT "WebInput_addedByUserId_fkey";

-- AlterTable
ALTER TABLE "WebInput" ALTER COLUMN "addedByUserId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "WebInput" ADD CONSTRAINT "WebInput_addedByUserId_fkey" FOREIGN KEY ("addedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
