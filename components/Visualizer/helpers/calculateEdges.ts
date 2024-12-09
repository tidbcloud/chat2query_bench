import { Edge, Node } from "reactflow";

import { DatabaseConfig, EdgeConfig } from "../types";

import { calculateSourcePosition } from "./calculateSourcePosition";
import { calculateTargetPosition } from "./calculateTargetPosition";
import { edgeClassName } from "./edgeClassName";
import { edgeMarkerName } from "./edgeMarkerName";

interface CalculateEdgesOptions {
  nodes: Node[];
  currentDatabase: DatabaseConfig;
}

export function updateEdgeHandle(nodes: Node[], edges: Edge[]) {
  return edges.map((edge) => {
    const sourceNode = nodes.find((node: Node) => node.id === edge.source);
    const targetNode = nodes.find((node: Node) => node.id === edge.target);
    if (sourceNode && targetNode) {
      const sourcePosition = calculateSourcePosition(
        sourceNode.width as number,
        sourceNode!.position.x,
        targetNode.width as number,
        targetNode!.position.x
      );
      const targetPosition = calculateTargetPosition(
        sourceNode.width as number,
        sourceNode!.position.x,
        targetNode.width as number,
        targetNode!.position.x
      );

      const sourceHandles = edge.sourceHandle?.split("-")!;
      sourceHandles[1] = sourcePosition;
      const targetHandles = edge.targetHandle?.split("-")!;
      targetHandles[1] = targetPosition;

      return {
        ...edge,
        sourceHandle: sourceHandles.join("-"),
        targetHandle: targetHandles.join("-"),
      };
    }
  });
}

export const calculateEdges = ({
  nodes,
  currentDatabase,
}: CalculateEdgesOptions) => {
  const initialEdges: Edge[] = [];

  currentDatabase.edgeConfigs.forEach((edgeConfig: EdgeConfig) => {
    const sourceNode = nodes.find(
      (node: Node) => node.id === edgeConfig.source
    );
    const targetNode = nodes.find(
      (node: Node) => node.id === edgeConfig.target
    );

    if (sourceNode && targetNode) {
      const sourcePosition =
        edgeConfig.sourcePosition ||
        calculateSourcePosition(
          sourceNode.width as number,
          sourceNode!.position.x,
          targetNode.width as number,
          targetNode!.position.x
        );
      const targetPosition =
        edgeConfig.targetPosition ||
        calculateTargetPosition(
          sourceNode.width as number,
          sourceNode!.position.x,
          targetNode.width as number,
          targetNode!.position.x
        );

      const sourceHandle = `${edgeConfig.sourceKey}-${sourcePosition}`;
      const targetHandle = `${edgeConfig.targetKey}-${targetPosition}`;

      initialEdges.push({
        id: `${edgeConfig.source}-${edgeConfig.target}`,
        source: edgeConfig.source,
        target: edgeConfig.target,
        sourceHandle,
        targetHandle,
        type: "smoothstep",
        markerEnd: edgeMarkerName(edgeConfig, targetPosition),
        className: edgeClassName(edgeConfig, targetPosition),
      });
    }
  });

  return initialEdges;
};
