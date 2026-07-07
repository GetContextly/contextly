export interface ContextlyConfig {
  projectId: string | null;
  name: string;
  updatedAt: string;
  exclude?: string[];
}

export interface MCPLocalConfig {
  mcpToken: string;
  projectId: string;
}
