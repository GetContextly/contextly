-- Waitlist for pre-launch email capture
CREATE TABLE IF NOT EXISTS public.waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    source TEXT DEFAULT 'landing_page',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Anyone can join the waitlist (no auth required)
CREATE POLICY "Anyone can join waitlist"
    ON public.waitlist FOR INSERT
    WITH CHECK (
        email IS NOT NULL
        AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    );

-- Only authenticated users can read the waitlist (for admin)
CREATE POLICY "Authenticated users can read waitlist"
    ON public.waitlist FOR SELECT
    USING (auth.uid() IS NOT NULL);
