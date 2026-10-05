import type { TaskStatus } from "@/domain/task/task.entity";
import type { TaskRepository } from "@/domain/task/task.repository";
import type { DependencyRepository } from "@/domain/task/dependency.repository";
import type {
  PredecessorLink,
  TaskDependency,
} from "@/domain/task/dependency";
import { shouldBlockSuccessor, wouldCreateCycle } from "@/domain/task/dependency";
import { NotFoundError, ValidationError } from "@/domain/shared/errors";
import { parseOrThrow } from "@/application/shared/validate";
import type { Repositories, UnitOfWork } from "@/application/shared/unit-of-work";
import { addDependencySchema, type AddDependencyInput } from "./dependency.dto";

export class DependencyService {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly dependencies: DependencyRepository,
    private readonly tasks: TaskRepository,
  ) {}

  async addDependency(input: AddDependencyInput): Promise<TaskDependency> {
    const data = parseOrThrow(
      addDependencySchema,
      input,
      "Ungültige Abhängigkeitsdaten.",
    );
    const type = data.type ?? "FINISH_TO_START";

    // Serializable: the cycle check reads the whole edge set and then inserts.
    // Running it serializable guarantees two concurrent adds cannot both pass
    // the check and jointly form a cycle.
    return this.uow.run(
      async (repos) => {
        const predecessor = await repos.tasks.findById(data.predecessorId);
        if (!predecessor) throw new NotFoundError("Task", data.predecessorId);
        const successor = await repos.tasks.findById(data.successorId);
        if (!successor) throw new NotFoundError("Task", data.successorId);

        const edges = await repos.dependencies.listEdges();
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

        const dependency = await repos.dependencies.create({ ...data, type });

        // FS to an unfinished predecessor blocks the successor automatically.
        if (
          type === "FINISH_TO_START" &&
          predecessor.status !== "DONE" &&
          successor.status !== "DONE" &&
          successor.status !== "BLOCKED"
        ) {
          await repos.tasks.update(successor.id, { status: "BLOCKED" });
        }

        return dependency;
      },
      { isolationLevel: "Serializable" },
    );
  }

  async removeDependency(id: string): Promise<void> {
    await this.uow.run(async (repos) => {
      const dependency = await repos.dependencies.findById(id);
      if (!dependency) throw new NotFoundError("TaskDependency", id);
      await repos.dependencies.delete(id);
      // Removing a blocker may free the successor.
      await this.unblockIfSatisfied(dependency.successorId, repos);
    });
  }

  /**
   * Call after a task's status becomes DONE: unblock successors whose
   * Finish-to-Start predecessors are now all satisfied. Runs on the caller's
   * transaction repositories so it is part of the same atomic unit.
   */
  async syncAfterCompletion(
    taskId: string,
    repos: Repositories,
  ): Promise<void> {
    const outgoing = await repos.dependencies.findByPredecessor(taskId);
    for (const dep of outgoing) {
      await this.unblockIfSatisfied(dep.successorId, repos);
    }
  }

  /**
   * Call after a task is reopened (DONE → unfinished): every unfinished
   * Finish-to-Start successor must go back to BLOCKED.
   */
  async syncAfterReopen(taskId: string, repos: Repositories): Promise<void> {
    const outgoing = await repos.dependencies.findByPredecessor(taskId);
    for (const dep of outgoing) {
      if (dep.type !== "FINISH_TO_START") continue;
      const successor = await repos.tasks.findById(dep.successorId);
      if (
        successor &&
        successor.status !== "DONE" &&
        successor.status !== "BLOCKED"
      ) {
        await repos.tasks.update(successor.id, { status: "BLOCKED" });
      }
    }
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

  /** Unblock a task if none of its FS predecessors still block it. */
  async unblockIfSatisfied(
    taskId: string,
    repos: Repositories,
  ): Promise<void> {
    const task = await repos.tasks.findById(taskId);
    if (!task || task.status !== "BLOCKED") return;

    const statuses = await this.finishToStartPredecessorStatuses(taskId, repos);
    if (!shouldBlockSuccessor(statuses)) {
      await repos.tasks.update(taskId, { status: "TODO" });
    }
  }

  private async finishToStartPredecessorStatuses(
    taskId: string,
    repos: Repositories,
  ) {
    const incoming = await repos.dependencies.findBySuccessor(taskId);
    const fs = incoming.filter((d) => d.type === "FINISH_TO_START");
    const statuses: TaskStatus[] = [];
    for (const d of fs) {
      const predecessor = await repos.tasks.findById(d.predecessorId);
      if (predecessor) statuses.push(predecessor.status);
    }
    return statuses;
  }
}
