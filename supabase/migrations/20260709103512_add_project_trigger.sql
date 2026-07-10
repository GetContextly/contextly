-- Policies for projects
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
