import type { TaskRepository } from "@/domain/task/task.repository";
import type { DependencyRepository } from "@/domain/task/dependency.repository";
import type {
  PredecessorLink,
  TaskDependency,
} from "@/domain/task/dependency";
import { shouldBlockSuccessor, wouldCreateCycle } from "@/domain/task/dependency";
import { NotFoundError, ValidationError } from "@/domain/shared/errors";
import { parseOrThrow } from "@/application/shared/validate";
import { addDependencySchema, type AddDependencyInput } from "./dependency.dto";

export class DependencyService {
  constructor(
    private readonly dependencies: DependencyRepository,
    private readonly tasks: TaskRepository,
  ) {}

  async addDependency(input: AddDependencyInput): Promise<TaskDependency> {
    const data = parseOrThrow(
      addDependencySchema,
      input,
      "Ungültige Abhängigkeitsdaten.",
    );

    const [predecessor, successor] = await Promise.all([
      this.tasks.findById(data.predecessorId),
      this.tasks.findById(data.successorId),
    ]);
    if (!predecessor) throw new NotFoundError("Task", data.predecessorId);
    if (!successor) throw new NotFoundError("Task", data.successorId);

    const edges = await this.dependencies.listEdges();
    if (
      wouldCreateCycle(edges, {
        predecessorId: data.predecessorId,
        successorId: data.successorId,
      })
    ) {
      throw new ValidationError(
        "Diese Abhängigkeit würde einen Zyklus erzeugen.",
      );
    }

    const type = data.type ?? "FINISH_TO_START";
    const dependency = await this.dependencies.create({ ...data, type });

    // FS to an unfinished predecessor blocks the successor automatically.
    if (
      type === "FINISH_TO_START" &&
      predecessor.status !== "DONE" &&
      successor.status !== "DONE" &&
      successor.status !== "BLOCKED"
    ) {
      await this.tasks.update(successor.id, { status: "BLOCKED" });
    }

    return dependency;
  }

  async removeDependency(id: string): Promise<void> {
    const dependency = await this.dependencies.findById(id);
    if (!dependency) throw new NotFoundError("TaskDependency", id);
    await this.dependencies.delete(id);
    // Removing a blocker may free the successor.
    await this.unblockIfSatisfied(dependency.successorId);
  }

  /**
   * Call after a task's status becomes DONE: unblock successors whose
   * Finish-to-Start predecessors are now all satisfied.
   */
  async syncAfterCompletion(taskId: string): Promise<void> {
    const outgoing = await this.dependencies.findByPredecessor(taskId);
    await Promise.all(
      outgoing.map((dep) => this.unblockIfSatisfied(dep.successorId)),
    );
  }

  /**
   * Call after a task is reopened (DONE → unfinished): every unfinished
   * Finish-to-Start successor must go back to BLOCKED.
   */
  async syncAfterReopen(taskId: string): Promise<void> {
    const outgoing = await this.dependencies.findByPredecessor(taskId);
    await Promise.all(
      outgoing.map(async (dep) => {
        if (dep.type !== "FINISH_TO_START") return;
        const successor = await this.tasks.findById(dep.successorId);
        if (successor && successor.status !== "DONE" && successor.status !== "BLOCKED") {
          await this.tasks.update(successor.id, { status: "BLOCKED" });
        }
      }),
    );
  }

  /** Read model: incoming dependencies of a task, enriched with predecessor. */
  async getPredecessors(taskId: string): Promise<PredecessorLink[]> {
    const incoming = await this.dependencies.findBySuccessor(taskId);
    const links = await Promise.all(
      incoming.map(async (dep) => {
        const predecessor = await this.tasks.findById(dep.predecessorId);
        if (!predecessor) return null;
        return {
          dependencyId: dep.id,
          type: dep.type,
          predecessor: {
            id: predecessor.id,
            title: predecessor.title,
            status: predecessor.status,
          },
        } satisfies PredecessorLink;
      }),
    );
    return links.filter((l): l is PredecessorLink => l !== null);
  }

  /** Read model for many tasks at once (e.g. a project's board/table). */
  async getPredecessorMap(
    taskIds: readonly string[],
  ): Promise<Record<string, PredecessorLink[]>> {
    const entries = await Promise.all(
      taskIds.map(async (id) => [id, await this.getPredecessors(id)] as const),
    );
    return Object.fromEntries(entries);
  }

  private async unblockIfSatisfied(taskId: string): Promise<void> {
    const task = await this.tasks.findById(taskId);
    if (!task || task.status !== "BLOCKED") return;

    const statuses = await this.finishToStartPredecessorStatuses(taskId);
    if (!shouldBlockSuccessor(statuses)) {
      await this.tasks.update(taskId, { status: "TODO" });
    }
  }

  private async finishToStartPredecessorStatuses(taskId: string) {
    const incoming = await this.dependencies.findBySuccessor(taskId);
    const fs = incoming.filter((d) => d.type === "FINISH_TO_START");
    const predecessors = await Promise.all(
      fs.map((d) => this.tasks.findById(d.predecessorId)),
    );
    return predecessors
      .filter((t): t is NonNullable<typeof t> => t !== null)
      .map((t) => t.status);
  }
}
