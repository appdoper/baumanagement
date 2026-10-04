import type {
  DependencyEdge,
  DependencyType,
  TaskDependency,
} from "./dependency";

export interface NewDependency {
  predecessorId: string;
  successorId: string;
  type: DependencyType;
  lagDays?: number;
}

/**
 * Port (domain boundary). Infrastructure provides the Prisma implementation.
 */
export interface DependencyRepository {
  create(data: NewDependency): Promise<TaskDependency>;
  findById(id: string): Promise<TaskDependency | null>;
  delete(id: string): Promise<void>;
  /** All edges in the graph — used for cycle detection. */
  listEdges(): Promise<DependencyEdge[]>;
  /** Dependencies where the given task is the successor (its predecessors). */
  findBySuccessor(successorId: string): Promise<TaskDependency[]>;
  /** Dependencies where the given task is the predecessor (its successors). */
  findByPredecessor(predecessorId: string): Promise<TaskDependency[]>;
}
