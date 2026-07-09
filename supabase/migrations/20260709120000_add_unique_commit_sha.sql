-- Prevent duplicate commit syncs
ALTER TABLE public.changes
  ADD CONSTRAINT changes_project_commit_unique UNIQUE (project_id, commit_sha);
