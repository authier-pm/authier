/*
  Warnings:

  - You are about to drop the column `androidUri` on the `EncryptedSecret` table. All the data in the column will be lost.
  - You are about to drop the column `iconUrl` on the `EncryptedSecret` table. All the data in the column will be lost.
  - You are about to drop the column `iosUri` on the `EncryptedSecret` table. All the data in the column will be lost.
  - You are about to drop the column `label` on the `EncryptedSecret` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `EncryptedSecret` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "EncryptedSecret" DROP COLUMN "androidUri",
DROP COLUMN "iconUrl",
DROP COLUMN "iosUri",
DROP COLUMN "label",
DROP COLUMN "url";
