export type ContextlyEvent =
  | { type: 'DECISION_LOGGED'; projectId: string; decisionId: string }
  | { type: 'PROJECT_CREATED'; projectId: string }
  | { type: 'MEMBER_JOINED'; projectId: string; userId: string };

export type EventHandler = (event: ContextlyEvent) => void;
