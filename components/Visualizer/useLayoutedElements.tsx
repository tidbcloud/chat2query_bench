import { useMemoizedFn } from "ahooks";
import ELK, { LayoutOptions } from "elkjs";
import { Edge, Node } from "reactflow";

const elk = new ELK();

export const useLayoutedElements = () => {
  const defaultOptions = {
    "elk.algorithm": "layered",
    "elk.layered.spacing.nodeNodeBetweenLayers": 100,
    "elk.spacing.nodeNode": 80,
  };

  const getLayoutedElements = useMemoizedFn(
    async (nodes: Node[], edges: Edge[], options: LayoutOptions) => {
      const layoutOptions = { ...defaultOptions, ...options };
      const graph = {
        id: "root",
        layoutOptions: layoutOptions,
        children: nodes,
        edges: edges,
      };

      // @ts-ignore
      const { children, edges: layoutEdges } = await elk.layout(graph);
      // By mutating the children in-place we saves ourselves from creating a
      // needless copy of the nodes array.
      if (children) {
        for (const node of children) {
          //@ts-ignore
          node.position = { x: node.x, y: node.y };
        }
      }

      return {
        nodes: children,
        edges: layoutEdges,
      };
    },
  );

  return { getLayoutedElements };
};
