ALTER TABLE gallery_items
ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'public';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'gallery_items_visibility_check'
  ) THEN
    ALTER TABLE gallery_items
    ADD CONSTRAINT gallery_items_visibility_check
    CHECK (visibility IN ('public', 'private'));
  END IF;
END $$;

UPDATE gallery_items
SET visibility = 'public'
WHERE visibility IS NULL;

CREATE INDEX IF NOT EXISTS idx_gallery_visibility ON gallery_items(visibility);
