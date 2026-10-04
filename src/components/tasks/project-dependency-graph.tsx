"use client";

import "@xyflow/react/dist/style.css";

import { useEffect, useMemo } from "react";
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
} from "@xyflow/react";
import dagre from "dagre";
import type { Task } from "@/domain/task/task.entity";
import type { PredecessorLink } from "@/domain/task/dependency";
import { formatEuro } from "@/lib/format";
import { TaskStatusBadge } from "./task-status-badge";

const NODE_WIDTH = 240;
const NODE_HEIGHT = 96;

type TaskNodeData = { task: Task };
type TaskFlowNode = Node<TaskNodeData, "task">;

function TaskNode({ data }: NodeProps<TaskFlowNode>) {
  const { task } = data;
  return (
    <div className="w-60 rounded-md border bg-background p-3 shadow-sm">
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-muted-foreground"
      />
      <p className="truncate text-sm font-medium leading-snug">{task.title}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <TaskStatusBadge status={task.status} />
        <span className="text-xs tabular-nums text-muted-foreground">
          {formatEuro(task.estimatedCostCents)}
        </span>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-muted-foreground"
      />
    </div>
  );
}

// Defined at module scope so React Flow doesn't warn about recreating the map.
const nodeTypes: NodeTypes = { task: TaskNode };

function buildGraph(
  tasks: Task[],
  predecessorMap: Record<string, PredecessorLink[]>,
): { nodes: TaskFlowNode[]; edges: Edge[] } {
  const taskById = new Map(tasks.map((t) => [t.id, t]));

  const nodes: TaskFlowNode[] = tasks.map((task) => ({
    id: task.id,
    type: "task",
    position: { x: 0, y: 0 },
    data: { task },
  }));

  const edges: Edge[] = [];
  for (const [successorId, links] of Object.entries(predecessorMap)) {
    for (const link of links) {
      // Only draw edges whose predecessor is part of this project.
      const predecessor = taskById.get(link.predecessor.id);
      if (!predecessor || !taskById.has(successorId)) continue;

      const isSameStart = link.type === "START_TO_START";
      edges.push({
        id: link.dependencyId,
        source: link.predecessor.id,
        target: successorId,
        type: "smoothstep",
        label: isSameStart ? "SS" : "FS",
        animated: predecessor.status === "IN_PROGRESS",
        markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
        style: isSameStart ? { strokeDasharray: "6 4" } : undefined,
        labelBgPadding: [4, 2],
        labelStyle: { fontSize: 10 },
      });
    }
  }

  return { nodes: layout(nodes, edges), edges };
}

function layout(nodes: TaskFlowNode[], edges: Edge[]): TaskFlowNode[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "LR", nodesep: 40, ranksep: 90 });

  for (const node of nodes) {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }
  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  return nodes.map((node) => {
    const { x, y } = g.node(node.id);
    return {
      ...node,
      position: { x: x - NODE_WIDTH / 2, y: y - NODE_HEIGHT / 2 },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    };
  });
}

export function ProjectDependencyGraph({
  tasks,
  predecessorMap,
}: {
  tasks: Task[];
  predecessorMap: Record<string, PredecessorLink[]>;
}) {
  const graph = useMemo(
    () => buildGraph(tasks, predecessorMap),
    [tasks, predecessorMap],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<TaskFlowNode>(
    graph.nodes,
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(graph.edges);

  // Keep the graph in sync when the server re-renders with fresh data.
  useEffect(() => {
    setNodes(graph.nodes);
    setEdges(graph.edges);
  }, [graph, setNodes, setEdges]);

  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        Noch keine Vorgänge in diesem Projekt.
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 w-full rounded-lg border">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        nodesConnectable={false}
        edgesFocusable={false}
        minZoom={0.2}
      >
        <Background />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
