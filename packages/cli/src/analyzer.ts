import { execFileSync } from 'child_process';

export interface ArchitecturalDecision {
  summary: string;
  reasoning: string;
  relatedFiles: string[];
  confidence: number;
}

const ARCHITECTURAL_KEYWORDS = [
  'refactor', 'architecture', 'schema', 'database', 'migration',
  'protocol', 'api', 'security', 'auth', 'dependency', 'framework',
  'performance', 'breaking', 'deprecat', 'redesign', 'restructur',
  'config', 'deploy', 'ci/cd', 'testing', 'lint', 'typescript',
  'middleware', 'cache', 'queue', 'webhook', 'oauth', 'encrypt',
  'rls', 'policy', 'trigger', 'function', 'index', 'constraint',
];

const ARCHITECTURAL_PATHS = [
  'schema', 'migration', 'auth', 'middleware', 'config',
  'docker', 'deploy', 'ci', '.github', 'supabase',
  'prisma', 'drizzle', 'drizzle', 'env', 'security',
];

/**
 * Analyzes a specific git diff to extract intent and decisions.
 */
export const analyzeDiff = (dir: string, sha: string): ArchitecturalDecision | null => {
  try {
    // SECURITY: Use execFileSync with array of args to prevent shell injection (CSEC-003)
    const diff = execFileSync('git', ['-C', dir, 'show', sha], { encoding: 'utf-8' });
    const stats = execFileSync('git', ['-C', dir, 'show', sha, '--stat'], { encoding: 'utf-8' });
    const message = execFileSync('git', ['-C', dir, 'log', '-1', '--pretty=%B', sha], { encoding: 'utf-8' });

    // Check if commit message contains architectural keywords
    const msgLower = message.toLowerCase();
    const isArchitecturalByMessage = ARCHITECTURAL_KEYWORDS.some(kw => msgLower.includes(kw));

    // Extract files from stats
    const fileLines = stats.split('\n').filter(l => l.includes('|'));
    const relatedFiles = fileLines.map(l => l.split('|')[0].trim());

    // Check if any changed files match architectural paths
    const isArchitecturalByPath = relatedFiles.some(f =>
      ARCHITECTURAL_PATHS.some(p => f.toLowerCase().includes(p))
    );

    if (!isArchitecturalByMessage && !isArchitecturalByPath) return null;

    const confidence = isArchitecturalByMessage && isArchitecturalByPath ? 0.9
      : isArchitecturalByMessage ? 0.7
      : 0.5;

    return {
      summary: message.split('\n')[0],
      reasoning: message,
      relatedFiles,
      confidence,
    };
  } catch (error) {
    return null;
  }
};

/**
 * Generates a prompt-ready project brief based on identified decisions.
 */
export const generateBrief = (decisions: ArchitecturalDecision[]): string => {
  let brief = "# Project Memory Brief\n\n";

  if (decisions.length === 0) {
    brief += "No major architectural decisions identified yet.\n";
    return brief;
  }

  brief += "## Key Decisions\n";
  decisions.forEach(d => {
    brief += `### ${d.summary}\n`;
    brief += `- **Reasoning**: ${d.reasoning.split('\n').slice(1).join(' ').trim() || 'N/A'}\n`;
    brief += `- **Affected Area**: ${d.relatedFiles.slice(0, 5).join(', ')}${d.relatedFiles.length > 5 ? '...' : ''}\n\n`;
  });

  return brief;
};
