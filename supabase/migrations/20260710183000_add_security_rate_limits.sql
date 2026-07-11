-- Security: Rate Limiting Table
CREATE TABLE IF NOT EXISTS public.rate_limits (
    key TEXT PRIMARY KEY, -- identifier (IP, user_id, or endpoint)
    request_count INTEGER DEFAULT 0,
    last_request_at TIMESTAMPTZ DEFAULT NOW(),
    window_start_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to check and increment rate limit
-- window_seconds: the timeframe (e.g. 60 for 1 minute)
-- max_requests: max allowed in that timeframe
CREATE OR REPLACE FUNCTION public.is_rate_limited(p_key TEXT, p_window_seconds INTEGER, p_max_requests INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    v_count INTEGER;
    v_window_start TIMESTAMPTZ;
BEGIN
    -- Get current state for the key
    SELECT request_count, window_start_at INTO v_count, v_window_start
    FROM public.rate_limits
    WHERE key = p_key;

    -- If no record exists or window expired, reset
    IF v_count IS NULL OR v_window_start < (NOW() - (p_window_seconds || ' seconds')::INTERVAL) THEN
        INSERT INTO public.rate_limits (key, request_count, window_start_at, last_request_at)
        VALUES (p_key, 1, NOW(), NOW())
        ON CONFLICT (key) DO UPDATE
        SET request_count = 1, window_start_at = NOW(), last_request_at = NOW();
        RETURN FALSE;
    END IF;

    -- If over limit
    IF v_count >= p_max_requests THEN
        RETURN TRUE;
    END IF;

    -- Increment count
    UPDATE public.rate_limits
    SET request_count = request_count + 1, last_request_at = NOW()
    WHERE key = p_key;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
