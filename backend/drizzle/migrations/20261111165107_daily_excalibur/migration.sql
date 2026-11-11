-- The preceding unreleased migration now preserves the legacy master-only choice.
-- Also support development databases that already applied its earlier version.
ALTER TYPE "UserNewDevicePolicy" ADD VALUE IF NOT EXISTS 'MASTER_DEVICE';
