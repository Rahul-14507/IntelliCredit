"use client";

import { useMemo } from "react";
import ReactFlow, { Background, Controls, Node, Edge } from "reactflow";
import "reactflow/dist/style.css";
import { Director } from "@/lib/types";

export default function PromoterGraph({
  directors,
  companyName,
}: {
  directors: Director[];
  companyName: string;
}) {
  const { nodes, edges } = useMemo(() => {
    if (!directors || directors.length === 0) return { nodes: [], edges: [] };

    const n: Node[] = [
      {
        id: "comp",
        position: { x: 250, y: 50 },
        data: { label: companyName },
        style: {
          backgroundColor: "#1e293b",
          color: "#fff",
          fontWeight: "bold",
        },
      },
    ];

    const e: Edge[] = [];

    directors.forEach((dir, idx) => {
      const dirId = `dir-${idx}`;
      n.push({
        id: dirId,
        position: {
          x: 100 + (idx % 3) * 150,
          y: 150 + Math.floor(idx / 3) * 100,
        },
        data: { label: `${dir.name}\\n(${dir.designation})` },
        style: { backgroundColor: "#bfdbfe" },
      });

      e.push({
        id: `e-${dirId}`,
        source: dirId,
        target: "comp",
        label: "Director",
      });
    });

    return { nodes: n, edges: e };
  }, [directors, companyName]);

  if (!nodes.length) {
    return (
      <div className="h-80 w-full bg-slate-50 flex items-center justify-center text-slate-500 rounded-md border text-sm">
        No director data found in uploaded documents
      </div>
    );
  }

  return (
    <div className="h-80 w-full bg-slate-50 relative border">
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <Background color="#ccc" gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
