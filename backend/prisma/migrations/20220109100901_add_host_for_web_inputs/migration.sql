/*
  Warnings:

  - You are about to alter the column `url` on the `WebInput` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(2048)`.
  - Added the required column `host` to the `WebInput` table without a default value. This is not possible if the table is not empty.

*/
-- CREATE EXTENSION IF NOT EXISTS citext;


-- AlterTable
ALTER TABLE "WebInput" ADD COLUMN     "host" VARCHAR(253),
ALTER COLUMN "url" SET DATA TYPE VARCHAR(2048);

UPDATE "WebInput"
SET host = url;

-- CreateIndex
CREATE INDEX "WebInput_host_idx" ON "WebInput"("host");

-- CreateIndex
CREATE INDEX "WebInput_kind_idx" ON "WebInput"("kind");

ALTER TABLE "WebInput" ALTER COLUMN  "host" SET NOT NULL;