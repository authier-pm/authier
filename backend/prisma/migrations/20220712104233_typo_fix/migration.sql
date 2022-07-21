/*
  Warnings:

  - You are about to drop the column `lanuage` on the `SettingsConfig` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SettingsConfig" DROP COLUMN "lanuage",
ADD COLUMN     "language" TEXT NOT NULL DEFAULT E'en';
