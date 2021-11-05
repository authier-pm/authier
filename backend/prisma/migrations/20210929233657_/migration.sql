/*
  Warnings:

  - A unique constraint covering the columns `[url,domPath]` on the table `WebInput` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "WebInput_url_domPath_key" ON "WebInput"("url", "domPath");
