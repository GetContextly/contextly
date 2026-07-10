-- Allow MCP server to record agent session connections
CREATE POLICY "Service role can insert agent sessions"
    ON public.agent_sessions FOR INSERT
    WITH CHECK (true);

-- Also allow updates (for last_sync_at)
CREATE POLICY "Service role can update agent sessions"
    ON public.agent_sessions FOR UPDATE
    USING (true);
