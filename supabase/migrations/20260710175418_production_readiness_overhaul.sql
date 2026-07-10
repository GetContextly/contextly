-- 1. Enable pgvector for RAG (Retrieval Augmented Generation)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Audit Logs for Security & Compliance
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL, -- 'context', 'decision', 'settings'
    entity_id UUID,
    metadata JSONB DEFAULT '{}',
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Vector Embeddings Table for Code & Context
CREATE TABLE IF NOT EXISTS public.embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding vector(1536), -- Standard OpenAI/Mistral embedding size
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. GitHub App Installation Support
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS github_installation_id TEXT,
ADD COLUMN IF NOT EXISTS github_full_name TEXT;

CREATE TABLE IF NOT EXISTS public.github_installations (
    id TEXT PRIMARY KEY, -- installation_id from GitHub
    account_id TEXT NOT NULL,
    account_login TEXT NOT NULL,
    target_type TEXT NOT NULL, -- 'Organization' or 'User'
    repository_selection TEXT NOT NULL, -- 'all' or 'selected'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Usage Quotas & Limits
CREATE TABLE IF NOT EXISTS public.usage_quotas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'enterprise')),
    projects_limit INTEGER DEFAULT 1,
    sync_limit_per_month INTEGER DEFAULT 100,
    current_month_sync_count INTEGER DEFAULT 0,
    last_reset_date TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.github_installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_quotas ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view audit logs for their projects"
    ON public.audit_logs FOR SELECT
    USING (public.has_project_access(project_id, auth.uid()));

CREATE POLICY "Users can view their own usage quotas"
    ON public.usage_quotas FOR SELECT
    USING (auth.uid() = user_id);

-- 6. Helper to check and increment usage
CREATE OR REPLACE FUNCTION public.check_sync_usage(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_limit INTEGER;
    v_current INTEGER;
BEGIN
    SELECT sync_limit_per_month, current_month_sync_count
    INTO v_limit, v_current
    FROM public.usage_quotas
    WHERE user_id = p_user_id;

    IF v_current >= v_limit THEN
        RETURN FALSE;
    END IF;

    UPDATE public.usage_quotas
    SET current_month_sync_count = current_month_sync_count + 1
    WHERE user_id = p_user_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
