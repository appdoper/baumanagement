import type { TaskStatus } from "./task.entity";

// Mirrors the persistence enum. FF/SF exist in the schema but are reserved for
// later phases — only FS and SS are wired into the current use cases.
export const DEPENDENCY_TYPES = [
  "FINISH_TO_START",
  "START_TO_START",
  "FINISH_TO_FINISH",
  "START_TO_FINISH",
] as const;

export type DependencyType = (typeof DEPENDENCY_TYPES)[number];

export const SUPPORTED_DEPENDENCY_TYPES = [
  "FINISH_TO_START",
  "START_TO_START",
] as const;

export type SupportedDependencyType = (typeof SUPPORTED_DEPENDENCY_TYPES)[number];

export interface TaskDependency {
  id: string;
  type: DependencyType;
  lagDays: number;
  predecessorId: string;
  successorId: string;
  createdAt: Date;
}

/** A directed edge predecessor → successor (the successor depends on the predecessor). */
export interface DependencyEdge {
  predecessorId: string;
  successorId: string;
}

/** Read model: an incoming dependency enriched with its predecessor task. */
export interface PredecessorLink {
  dependencyId: string;
  type: DependencyType;
  predecessor: { id: string; title: string; status: TaskStatus };
}

/** Number of Finish-to-Start predecessors that are not yet done. */
export function countBlockingPredecessors(
  links: readonly PredecessorLink[],
): number {
  return links.filter(
    (l) => l.type === "FINISH_TO_START" && l.predecessor.status !== "DONE",
  ).length;
}

/**
 * Returns true if adding `candidate` to the existing dependency graph would
 * introduce a cycle (A → … → A). A dependency edge points predecessor →
 * successor, so a cycle means a task would — directly or transitively — depend
 * on itself. Uses an iterative DFS: a cycle is created exactly when the
 * candidate's predecessor is already reachable from its successor.
 */
export function wouldCreateCycle(
  edges: readonly DependencyEdge[],
  candidate: DependencyEdge,
): boolean {
  if (candidate.predecessorId === candidate.successorId) return true;

  const adjacency = new Map<string, string[]>();
  for (const edge of edges) {
    const successors = adjacency.get(edge.predecessorId);
    if (successors) successors.push(edge.successorId);
    else adjacency.set(edge.predecessorId, [edge.successorId]);
  }

  const target = candidate.predecessorId;
  const visited = new Set<string>();
  const stack: string[] = [candidate.successorId];

  while (stack.length > 0) {
    const current = stack.pop() as string;
    if (current === target) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    for (const next of adjacency.get(current) ?? []) stack.push(next);
  }

  return false;
}

/**
 * A task is blocked while any of its Finish-to-Start predecessors is not yet
 * done. Only FS gates execution; SS is a scheduling hint and never blocks.
 */
export function shouldBlockSuccessor(
  finishToStartPredecessorStatuses: readonly TaskStatus[],
): boolean {
  return finishToStartPredecessorStatuses.some((status) => status !== "DONE");
}
