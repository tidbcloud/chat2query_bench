import Dagre from "@dagrejs/dagre";
import { maxBy } from "lodash-es";
import { Edge, Node } from "reactflow";

export const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB" });

  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  for (const node of nodes) {
    //@ts-ignore
    g.setNode(node.id, { ...node });
  }

  Dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const { x, y, rank } = g.node(node.id);
    return {
      ...node,
      position: {
        x,
        y,
      },
      data: { ...node.data, rank },
    };
  });

  layoutedNodes.sort((a, b) => a.data.rank - b.data.rank);

  for (const node of layoutedNodes) {
    const parentRankWithMaxHeight = maxBy(
      layoutedNodes.filter((i) => node.data.rank - i.data.rank === 2),
      (o) => o.height,
    );

    node.position.y =
      (parentRankWithMaxHeight?.position.y ?? 0) +
      (parentRankWithMaxHeight?.height ?? 0) +
      50;
  }

  return {
    nodes: layoutedNodes,
    edges,
  };
};
