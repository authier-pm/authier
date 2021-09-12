/*
  Warnings:

  - The primary key for the `SettingsConfig` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `SettingsConfig` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SettingsConfig" DROP CONSTRAINT "SettingsConfig_pkey",
DROP COLUMN "id",
ADD PRIMARY KEY ("userId");
