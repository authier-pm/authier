WITH RowNumCTE AS (
    SELECT
        id, -- Assuming 'id' is the primary key of the "Device" table
        "firebaseToken",
        ROW_NUMBER() OVER(PARTITION BY "firebaseToken" ORDER BY id ASC) as rn
    FROM
        "Device"
    WHERE "firebaseToken" IS NOT NULL -- Process only non-null tokens
)
UPDATE "Device"
SET "firebaseToken" = NULL
FROM RowNumCTE
WHERE "Device".id = RowNumCTE.id  -- Join condition
  AND RowNumCTE.rn > 1            -- Mark duplicates for nullification
  AND RowNumCTE."firebaseToken" IN ( -- Ensure we only touch tokens that were actually duplicated
    SELECT "firebaseToken"
    FROM "Device"
    WHERE "firebaseToken" IS NOT NULL
    GROUP BY "firebaseToken"
    HAVING COUNT(*) > 1
  );

-- CreateIndex
CREATE UNIQUE INDEX "Device_firebaseToken_key" ON "Device"("firebaseToken");
