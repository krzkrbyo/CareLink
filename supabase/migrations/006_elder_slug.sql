-- Enlaces cortos por persona (slug en URL en lugar de UUID)

ALTER TABLE elders ADD COLUMN IF NOT EXISTS slug TEXT;

UPDATE elders
SET slug = 'don-manuel'
WHERE id = '00000000-0000-4000-8000-000000000001'
  AND slug IS NULL;

UPDATE elders
SET slug = trim(both '-' FROM lower(regexp_replace(full_name, '[^a-zA-Z0-9]+', '-', 'g')))
WHERE slug IS NULL
  AND trim(both '-' FROM lower(regexp_replace(full_name, '[^a-zA-Z0-9]+', '-', 'g'))) <> '';

UPDATE elders
SET slug = 'persona-' || substring(replace(id::text, '-', ''), 1, 8)
WHERE slug IS NULL;

ALTER TABLE elders ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS elders_slug_key ON elders (slug);
