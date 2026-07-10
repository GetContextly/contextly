-- reasoning is core to the value prop — enforce at DB level
-- First backfill any null values
UPDATE public.decisions SET reasoning = '' WHERE reasoning IS NULL;
ALTER TABLE public.decisions ALTER COLUMN reasoning SET NOT NULL;
ALTER TABLE public.decisions ALTER COLUMN reasoning SET DEFAULT '';
