-- AlterTable
ALTER TABLE "Device" ALTER COLUMN "vaultLockTimeoutSeconds" SET DEFAULT 28800;

-- CreateTable
CREATE TABLE "MasterDeviceChange" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processAt" TIMESTAMP(3) NOT NULL,
    "oldDeviceId" TEXT NOT NULL,
    "newDeviceId" TEXT NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "MasterDeviceChange_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MasterDeviceChange" ADD CONSTRAINT "MasterDeviceChange_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
