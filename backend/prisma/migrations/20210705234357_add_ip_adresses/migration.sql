/*
  Warnings:

  - You are about to drop the column `createdAt` on the `OTPCodeEvent` table. All the data in the column will be lost.
  - Added the required column `firstIpAdress` to the `Device` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastIpAdress` to the `Device` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ipAdress` to the `OTPCodeEvent` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Device" ADD COLUMN     "firstIpAdress" INET NOT NULL,
ADD COLUMN     "lastIpAdress" INET NOT NULL;

-- AlterTable
ALTER TABLE "OTPCodeEvent" DROP COLUMN "createdAt",
ADD COLUMN     "ipAdress" INET NOT NULL,
ADD COLUMN     "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "webOTPInputId" INTEGER;

-- AddForeignKey
ALTER TABLE "OTPCodeEvent" ADD FOREIGN KEY ("webOTPInputId") REFERENCES "WebOTPInput"("id") ON DELETE SET NULL ON UPDATE CASCADE;
