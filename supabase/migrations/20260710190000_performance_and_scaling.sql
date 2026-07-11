-- Elite CTO Scaling Overhaul: High-Performance Indexing and Aggregated Stats

-- 1. High-Performance Vector Indexing (HNSW)
-- Standard pgvector distance operator is fast, but for millions of embeddings, HNSW is required.
CREATE INDEX ON public.embeddings USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 2. Composite Indexing for Rapid Retrieval
-- Most queries filter by project_id and order by created_at.
CREATE INDEX IF NOT EXISTS idx_decisions_project_created ON public.decisions (project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_changes_project_created ON public.changes (project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_project_created ON public.audit_logs (project_id, created_at DESC);

-- 3. Materialized Project Statistics (Scaling counts)
-- Running SELECT COUNT(*) on millions of rows is slow. We'll use a summary table.
CREATE TABLE IF NOT EXISTS public.project_stats (
    project_id UUID PRIMARY KEY REFERENCES public.projects(id) ON DELETE CASCADE,
    decision_count BIGINT DEFAULT 0,
    change_count BIGINT DEFAULT 0,
    last_sync_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Trigger to maintain stats automatically
CREATE OR REPLACE FUNCTION public.sync_project_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.project_stats (project_id, decision_count, change_count, last_sync_at)
        VALUES (
            NEW.project_id,
            CASE WHEN TG_TABLE_NAME = 'decisions' THEN 1 ELSE 0 END,
            CASE WHEN TG_TABLE_NAME = 'changes' THEN 1 ELSE 0 END,
            NOW()
        )
        ON CONFLICT (project_id) DO UPDATE SET
            decision_count = project_stats.decision_count + (CASE WHEN TG_TABLE_NAME = 'decisions' THEN 1 ELSE 0 END),
            change_count = project_stats.change_count + (CASE WHEN TG_TABLE_NAME = 'changes' THEN 1 ELSE 0 END),
            last_sync_at = NOW(),
            updated_at = NOW();
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.project_stats SET
            decision_count = decision_count - (CASE WHEN TG_TABLE_NAME = 'decisions' THEN 1 ELSE 0 END),
            change_count = change_count - (CASE WHEN TG_TABLE_NAME = 'changes' THEN 1 ELSE 0 END),
            updated_at = NOW()
        WHERE project_id = OLD.project_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_decisions_stats_update
    AFTER INSERT OR DELETE ON public.decisions
    FOR EACH ROW EXECUTE PROCEDURE public.sync_project_stats();

CREATE TRIGGER tr_changes_stats_update
    AFTER INSERT OR DELETE ON public.changes
    FOR EACH ROW EXECUTE PROCEDURE public.sync_project_stats();

-- 5. Rate Limiting Function (Database Level)
-- Simple leaky bucket implementation placeholder for API protection
CREATE TABLE IF NOT EXISTS public.rate_limits (
    key TEXT PRIMARY KEY,
    hits INTEGER DEFAULT 0,
    last_hit TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION check_rate_limit(p_key TEXT, p_limit INTEGER, p_window INTERVAL)
RETURNS BOOLEAN AS $$
DECLARE
    v_hits INTEGER;
BEGIN
    DELETE FROM public.rate_limits WHERE last_hit < NOW() - p_window;

    INSERT INTO public.rate_limits (key, hits, last_hit)
    VALUES (p_key, 1, NOW())
    ON CONFLICT (key) DO UPDATE SET
        hits = rate_limits.hits + 1,
        last_hit = NOW()
    RETURNING hits INTO v_hits;

    RETURN v_hits <= p_limit;
END;
$$ LANGUAGE plpgsql;
