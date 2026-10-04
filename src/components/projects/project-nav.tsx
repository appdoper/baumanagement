"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { ProjectNode } from "@/lib/project-tree";

export function ProjectNav({ nodes }: { nodes: ProjectNode[] }) {
  return (
    <ul className="space-y-0.5">
      {nodes.map((node) => (
        <ProjectNavItem key={node.id} node={node} depth={0} />
      ))}
    </ul>
  );
}

function ProjectNavItem({ node, depth }: { node: ProjectNode; depth: number }) {
  const pathname = usePathname();
  const href = `/projects/${node.id}`;
  const active = pathname === href;

  return (
    <li>
      <Link
        href={href}
        className={cn(
          "flex items-center rounded-md px-2 py-1.5 text-sm transition-colors",
          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          active && "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
        )}
        style={{ paddingLeft: `${0.5 + depth * 0.875}rem` }}
      >
        <span className="truncate">{node.name}</span>
      </Link>
      {node.children.length > 0 && (
        <ul className="space-y-0.5">
          {node.children.map((child) => (
            <ProjectNavItem key={child.id} node={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}
