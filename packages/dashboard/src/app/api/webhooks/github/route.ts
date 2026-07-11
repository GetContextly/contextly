import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { sanitizeInput } from '@/lib/security';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const GITHUB_WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';

  // RATE LIMITING (CSEC-002) - 100 requests per minute for webhooks
  const { data: isLimited, error: limitError } = await supabase.rpc('is_rate_limited', {
    p_key: `github_webhook_${ip}`,
    p_window_seconds: 60,
    p_max_requests: 100
  });

  if (limitError || isLimited) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  // PAYLOAD SIZE LIMIT (CSEC-004) - 5MB limit
  const contentLength = parseInt(req.headers.get('content-length') || '0');
  if (contentLength > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }

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
    } else if (event === 'installation') {
      await handleInstallation(body);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Webhook error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

interface GitHubCommit {
  id: string;
  message: string;
  timestamp: string;
  author: {
    name: string;
    email: string;
  };
}

interface GitHubPushEvent {
  repository: {
    html_url: string;
  };
  commits: GitHubCommit[];
}

interface GitHubPullRequestEvent {
  action: string;
  pull_request: {
    number: number;
    title: string;
    body: string | null;
    merged: boolean;
  };
  repository: {
    html_url: string;
  };
}

interface GitHubInstallationEvent {
  action: 'created' | 'deleted' | 'new_permissions_accepted' | 'suspend' | 'unsuspend';
  installation: {
    id: number;
    account: {
      id: number;
      login: string;
      type: string;
    };
    repository_selection: string;
  };
}

async function handleInstallation(body: GitHubInstallationEvent) {
  const { action, installation } = body;

  if (action === 'created' || action === 'new_permissions_accepted') {
    const { error } = await supabase.from('github_installations').upsert({
      id: installation.id.toString(),
      account_id: installation.account.id.toString(),
      account_login: installation.account.login,
      target_type: installation.account.type,
      repository_selection: installation.repository_selection,
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;
  } else if (action === 'deleted') {
    const { error } = await supabase
      .from('github_installations')
      .delete()
      .eq('id', installation.id.toString());

    if (error) throw error;

    // Also clear installation_id from projects
    await supabase
      .from('projects')
      .update({ github_installation_id: null })
      .eq('github_installation_id', installation.id.toString());
  }
}

async function handlePush(body: GitHubPushEvent) {
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
  const changes = commits.map((commit) => ({
    project_id: project.id,
    summary: sanitizeInput(commit.message),
    commit_sha: commit.id,
    created_at: commit.timestamp,
  }));

  const { error: insertError } = await supabase.from('changes').insert(changes);
  if (insertError) throw insertError;
}

async function handlePullRequest(body: GitHubPullRequestEvent) {
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
    summary: sanitizeInput(`Merged PR #${pr.number}: ${pr.title}`),
    reasoning: sanitizeInput(pr.body || 'No description provided.'),
    source: 'pull_request',
    related_files: [], // Could be populated by fetching PR files via GitHub API
  });

  if (insertError) throw insertError;
}
