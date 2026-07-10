import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const GITHUB_WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const signature = req.headers.get('x-hub-signature-256') || '';

  // Verify signature
  if (GITHUB_WEBHOOK_SECRET) {
    const hmac = crypto.createHmac('sha256', GITHUB_WEBHOOK_SECRET);
    const digest = 'sha256=' + hmac.update(payload).digest('hex');

    if (signature !== digest) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  }

  const event = req.headers.get('x-github-event');
  const body = JSON.parse(payload);

  try {
    if (event === 'push') {
      await handlePush(body);
    } else if (event === 'pull_request') {
      await handlePullRequest(body);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handlePush(body: any) {
  const repoUrl = body.repository.html_url;
  const commits = body.commits;

  // Find the project associated with this repo
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id')
    .eq('github_repo_url', repoUrl)
    .single();

  if (projectError || !project) {
    console.warn(`No project found for repo: ${repoUrl}`);
    return;
  }

  // Log each commit as a change
  const changes = commits.map((commit: any) => ({
    project_id: project.id,
    summary: commit.message,
    commit_sha: commit.id,
    created_at: commit.timestamp,
  }));

  const { error: insertError } = await supabase.from('changes').insert(changes);
  if (insertError) throw insertError;
}

async function handlePullRequest(body: any) {
  if (body.action !== 'closed' || !body.pull_request.merged) {
    return;
  }

  const repoUrl = body.repository.html_url;
  const pr = body.pull_request;

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id')
    .eq('github_repo_url', repoUrl)
    .single();

  if (projectError || !project) return;

  // Log PR merge as a significant decision/change
  const { error: insertError } = await supabase.from('decisions').insert({
    project_id: project.id,
    summary: `Merged PR #${pr.number}: ${pr.title}`,
    reasoning: pr.body || 'No description provided.',
    source: 'pull_request',
    related_files: [], // Could be populated by fetching PR files via GitHub API
  });

  if (insertError) throw insertError;
}
