/*
  Warnings:

  - You are about to drop the column `homeUI` on the `SettingsConfig` table. All the data in the column will be lost.
  - You are about to drop the column `noHandsLogin` on the `SettingsConfig` table. All the data in the column will be lost.
  - Added the required column `autofill` to the `SettingsConfig` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SettingsConfig" DROP COLUMN "homeUI",
DROP COLUMN "noHandsLogin",
ADD COLUMN     "autofill" BOOLEAN NOT NULL,
ADD COLUMN     "lanuage" TEXT NOT NULL DEFAULT E'en';
