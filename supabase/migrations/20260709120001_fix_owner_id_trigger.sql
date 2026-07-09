-- Fix handle_new_project to populate owner_id before insert
DROP TRIGGER IF EXISTS on_project_created ON public.projects;
DROP FUNCTION IF EXISTS public.handle_new_project();

CREATE OR REPLACE FUNCTION public.handle_new_project()
RETURNS TRIGGER AS $$
BEGIN
    -- Populate owner_id on the project row itself
    NEW.owner_id := auth.uid();
    -- Add owner to project_members
    INSERT INTO public.project_members (project_id, user_id, role)
    VALUES (NEW.id, auth.uid(), 'owner');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Use BEFORE INSERT so we can modify NEW.owner_id
CREATE TRIGGER on_project_created
    BEFORE INSERT ON public.projects
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_project();
