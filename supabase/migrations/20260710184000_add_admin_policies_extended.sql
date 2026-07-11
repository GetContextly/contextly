-- Extended Admin Policies for all tables

-- Profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- Decisions
CREATE POLICY "Admins can view all decisions" ON public.decisions
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- Changes
CREATE POLICY "Admins can view all changes" ON public.changes
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- Audit Logs
CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE));
