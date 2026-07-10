-- Contextly Supabase Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    github_repo_url TEXT,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    mcp_token TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project Members (Join table for roles)
CREATE TABLE IF NOT EXISTS public.project_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'member', 'viewer')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- Decisions table (The "Why")
CREATE TABLE IF NOT EXISTS public.decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    summary TEXT NOT NULL,
    reasoning TEXT,
    source TEXT CHECK (source IN ('git_commit', 'pull_request', 'agent_logged', 'manual')),
    related_files TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Changes table (Routine updates)
CREATE TABLE IF NOT EXISTS public.changes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    summary TEXT NOT NULL,
    commit_sha TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent Sessions
CREATE TABLE IF NOT EXISTS public.agent_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    agent_type TEXT,
    connected_at TIMESTAMPTZ DEFAULT NOW(),
    last_sync_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS)

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_sessions ENABLE ROW LEVEL SECURITY;

-- Helper function to check project access
CREATE OR REPLACE FUNCTION public.has_project_access(p_project_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.project_members
        WHERE project_id = p_project_id AND user_id = p_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies for projects
CREATE POLICY "Users can view projects they are members of"
    ON public.projects FOR SELECT
    USING (public.has_project_access(id, auth.uid()));

CREATE POLICY "Authenticated users can create projects"
    ON public.projects FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Trigger to auto-add owner to project_members
CREATE OR REPLACE FUNCTION public.handle_new_project()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.project_members (project_id, user_id, role)
    VALUES (NEW.id, auth.uid(), 'owner');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_project_created
    AFTER INSERT ON public.projects
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_project();

-- Policies for project_members
CREATE POLICY "Users can view project members of their projects"
    ON public.project_members FOR SELECT
    USING (public.has_project_access(project_id, auth.uid()));

-- Policies for decisions
CREATE POLICY "Users can view decisions for their projects"
    ON public.decisions FOR SELECT
    USING (public.has_project_access(project_id, auth.uid()));

CREATE POLICY "Owners and members can insert decisions"
    ON public.decisions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = decisions.project_id
            AND user_id = auth.uid()
            AND role IN ('owner', 'member')
        )
    );

-- Policies for changes
CREATE POLICY "Users can view changes for their projects"
    ON public.changes FOR SELECT
    USING (public.has_project_access(project_id, auth.uid()));

CREATE POLICY "Owners and members can insert changes"
    ON public.changes FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = changes.project_id
            AND user_id = auth.uid()
            AND role IN ('owner', 'member')
        )
    );

-- Policies for agent_sessions
CREATE POLICY "Users can view agent sessions for their projects"
    ON public.agent_sessions FOR SELECT
    USING (public.has_project_access(project_id, auth.uid()));

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
