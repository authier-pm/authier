/*
  Warnings:

  - Added the required column `domCoordinates` to the `WebInput` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "WebInput" ADD COLUMN     "domCoordinates" JSONB NOT NULL;
