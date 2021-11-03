/*
  Warnings:

  - A unique constraint covering the columns `[loginSecret]` on the table `Device` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `loginSecret` to the `Device` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Device" ADD COLUMN     "loginSecret" UUID NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Device_loginSecret_key" ON "Device"("loginSecret");
