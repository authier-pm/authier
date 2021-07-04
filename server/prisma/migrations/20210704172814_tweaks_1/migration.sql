/*
  Warnings:

  - You are about to alter the column `url` on the `OTPCodeEvent` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(2048)`.
  - You are about to alter the column `url` on the `WebOTPInput` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(2048)`.

*/
-- AlterTable
ALTER TABLE "OTPCodeEvent" ALTER COLUMN "url" SET DATA TYPE VARCHAR(2048);

-- AlterTable
ALTER TABLE "WebOTPInput" ALTER COLUMN "url" SET DATA TYPE VARCHAR(2048);
