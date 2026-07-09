-- Add watch status for planned / watching / finished flow
ALTER TABLE watchlist
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'planned'
  CHECK (status IN ('planned', 'watching', 'finished'));

UPDATE watchlist
SET status = CASE WHEN watched THEN 'finished' ELSE 'planned' END
WHERE status = 'planned' AND watched = true;
