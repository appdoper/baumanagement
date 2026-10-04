import type { Project } from "@/domain/project/project.entity";

export interface ProjectNode extends Project {
  children: ProjectNode[];
}

/** Builds a nested tree from a flat list (adjacency list -> tree). */
export function buildProjectTree(projects: Project[]): ProjectNode[] {
  const byId = new Map<string, ProjectNode>();
  for (const p of projects) byId.set(p.id, { ...p, children: [] });

  const roots: ProjectNode[] = [];
  for (const node of byId.values()) {
    const parent = node.parentId ? byId.get(node.parentId) : null;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  return roots;
}
