export {
  type Conflict,
  type ContextEntry,
  type EntryKind,
  type EntryStatus,
  type InsertEntry,
  type InsertResult,
  StoreError,
  type StoreErrorCode,
} from "./types";
export { Store, computeId } from "./store";
export { Compiler } from "./compiler";
export {
  type CacheEntry,
  type CompiledContext,
  type CompiledEntry,
  type CompilerOptions,
  type DropRecord,
  type Provenance,
} from "./compiler-types";
export {
  InMemoryRelay,
  MergeEngine,
  SyncEngine,
  type CloudRelay,
  type MergeResult,
  type PendingEntry,
  type PendingResult,
  type PullOptions,
  type PullResult,
  type PushResult,
  type RelayScopeState,
  type SyncError,
  type SyncState,
  type SyncSummary,
} from "./sync/index.js";
export {
  ConflictResolver,
  authorityLevel,
  type AggregatedConflict,
  type AutoResolveResult,
  type EscalationPolicy,
  type FeedbackRecord,
  type ManualResolveInput,
  type ResolutionRecord,
  type ResolutionRule,
  type ResolutionRuleName,
  type ResolverStats,
} from "./resolver/index.js";