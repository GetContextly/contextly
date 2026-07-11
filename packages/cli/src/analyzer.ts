import { execFileSync } from 'child_process';

export interface ArchitecturalDecision {
  summary: string;
  reasoning: string;
  relatedFiles: string[];
  confidence: number;
}

/**
 * Analyzes a specific git diff to extract intent and decisions.
 */
export const analyzeDiff = (dir: string, sha: string): ArchitecturalDecision | null => {
  try {
    // SECURITY: Use execFileSync with array of args to prevent shell injection (CSEC-003)
    const diff = execFileSync('git', ['-C', dir, 'show', sha], { encoding: 'utf-8' });
    const stats = execFileSync('git', ['-C', dir, 'show', sha, '--stat'], { encoding: 'utf-8' });
    const message = execFileSync('git', ['-C', dir, 'log', '-1', '--pretty=%B', sha], { encoding: 'utf-8' });

    // HEURISTIC: Check if this commit looks like an architectural decision
    // In a real version, we'd use a local LLM or a sophisticated regex engine.
    const architectureKeywords = [
      'refactor', 'architecture', 'schema', 'database', 'migration',
      'protocol', 'api', 'security', 'auth', 'dependency', 'framework'
    ];

    const isArchitectural = architectureKeywords.some(kw =>
      message.toLowerCase().includes(kw)
    );

    if (!isArchitectural) return null;

    // Extract files from stats
    const fileLines = stats.split('\n').filter(l => l.includes('|'));
    const relatedFiles = fileLines.map(l => l.split('|')[0].trim());

    return {
      summary: message.split('\n')[0],
      reasoning: message, // For now, use the full commit body
      relatedFiles,
      confidence: 0.8
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
