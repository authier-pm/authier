/*
  Warnings:

  - You are about to drop the column `TwoFA` on the `SettingsConfig` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `SettingsConfig` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `homeUI` to the `SettingsConfig` table without a default value. This is not possible if the table is not empty.
  - Added the required column `noHadsLogin` to the `SettingsConfig` table without a default value. This is not possible if the table is not empty.
  - Added the required column `twoFA` to the `SettingsConfig` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `SettingsConfig` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SettingsConfig" DROP COLUMN "TwoFA",
ADD COLUMN     "homeUI" TEXT NOT NULL,
ADD COLUMN     "noHadsLogin" BOOLEAN NOT NULL,
ADD COLUMN     "twoFA" BOOLEAN NOT NULL,
ADD COLUMN     "userId" UUID NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "SettingsConfig.userId_unique" ON "SettingsConfig"("userId");

-- AddForeignKey
ALTER TABLE "SettingsConfig" ADD FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
