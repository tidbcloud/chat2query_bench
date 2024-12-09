import "reactflow/dist/style.css";
import { useMemoizedFn } from "ahooks";
import { useState } from "react";
import ReactFlow, {
  Node,
  useNodesState,
  useEdgesState,
  Controls,
  ControlButton,
  Background,
  useStoreApi,
  getConnectedEdges,
  OnSelectionChangeParams,
  NodeChange,
  getIncomers,
  getOutgoers,
  ReactFlowInstance,
  useReactFlow,
} from "reactflow";

import { nodeTypes } from "./components";
import { Markers, MaximizeIcon, MinimizeIcon } from "./components";
import {
  calculateEdges,
  calculateSourcePosition,
  calculateTargetPosition,
  edgeClassName,
  edgeMarkerName,
  initializeNodes,
  moveSVGInFront,
  setEdgeClassName,
  setHighlightEdgeClassName,
  updateEdgeHandle,
} from "./helpers";
import { DatabaseConfig, EdgeConfig } from "./types";
import { useLayoutedElements } from "./useLayoutedElements";

interface SchemaDiagramProps {
  databaseSchema: DatabaseConfig;
}

const SchemaDiagram: React.FC<SchemaDiagramProps> = (
  props: SchemaDiagramProps,
) => {
  const currentDatabase = props.databaseSchema;
  const initialNodes = initializeNodes(props.databaseSchema);

  const store = useStoreApi();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [fullscreenOn, setFullScreen] = useState(false);
  const { getLayoutedElements } = useLayoutedElements();
  const { fitView } = useReactFlow();

  const onInit = useMemoizedFn((instance: ReactFlowInstance) => {
    const nodes = instance.getNodes();
    const initialEdges = calculateEdges({ nodes, currentDatabase });
    setEdges(initialEdges);

    getLayoutedElements(nodes, initialEdges, {
      "elk.algorithm": "layered",
      "elk.direction": "RIGHT",
    })
      .then(({ nodes: layoutedNodes, edges: layoutedEdges }) => {
        //@ts-ignore
        setNodes(layoutedNodes);
        //@ts-ignore
        setEdges(updateEdgeHandle(layoutedNodes, layoutedEdges));
      })
      .then(() => {
        window.setTimeout(() => {
          fitView();
        }, 100);
      });

    // https://javascriptf1.com/snippet/detect-fullscreen-mode-with-javascript
    window.addEventListener("resize", () => {
      setFullScreen(window.innerHeight === window.screen.height);
    });
  });

  // https://github.com/wbkd/react-flow/issues/2580
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const onNodeMouseEnter = useMemoizedFn((_: any, node: Node) => {
    const state = store.getState();
    state.resetSelectedElements();
    state.addSelectedNodes([node.id]);
    const connectedEdges = getConnectedEdges([node], edges);
    setEdges((eds) => {
      return eds.map((ed) => {
        if (connectedEdges.find((e) => e.id === ed.id)) {
          setHighlightEdgeClassName(ed);
        }

        return ed;
      });
    });
  });

  const onNodeMouseLeave = useMemoizedFn(() => {
    const state = store.getState();
    state.resetSelectedElements();
    setEdges((eds) => eds.map((ed) => setEdgeClassName(ed)));

    // https://stackoverflow.com/questions/2520650/how-do-you-clear-the-focus-in-javascript
    (
      globalThis.document && (globalThis.document.activeElement as HTMLElement)
    ).blur();
  });

  const onSelectionChange = useMemoizedFn((params: OnSelectionChangeParams) => {
    const edges = params.edges;
    // biome-ignore lint/complexity/noForEach: <explanation>
    edges.forEach((ed) => {
      const svg = document
        .querySelector(".react-flow__edges")
        ?.querySelector(`[data-testid="rf__edge-${ed.id}"]`);
      moveSVGInFront(svg);
    });
  });

  const handleNodesChange = useMemoizedFn((nodeChanges: NodeChange[]) => {
    // biome-ignore lint/complexity/noForEach: <explanation>
    nodeChanges.forEach((nodeChange) => {
      if (nodeChange.type === "position" && nodeChange.positionAbsolute) {
        // nodeChange.positionAbsolute contains new position
        const node = nodes.find((node) => node.id === nodeChange.id);

        if (!node) {
          return;
        }

        const incomingNodes = getIncomers(node, nodes, edges);
        // biome-ignore lint/complexity/noForEach: <explanation>
        incomingNodes.forEach((incomingNode) => {
          const edge = edges.find((edge) => {
            return edge.id === `${incomingNode.id}-${node.id}`;
          });

          const edgeConfig = currentDatabase.edgeConfigs.find(
            (edgeConfig: EdgeConfig) => {
              return (
                edgeConfig.source === incomingNode.id &&
                edgeConfig.target === node.id
              );
            },
          );

          if (nodeChange.positionAbsolute?.x) {
            setEdges((eds) =>
              eds.map((ed) => {
                if (edge && ed.id === edge.id) {
                  const sourcePosition =
                    edgeConfig!.sourcePosition ||
                    calculateSourcePosition(
                      incomingNode.width as number,
                      incomingNode.position.x,
                      node.width as number,
                      nodeChange.positionAbsolute!.x,
                    );
                  const targetPosition =
                    edgeConfig!.targetPosition ||
                    calculateTargetPosition(
                      incomingNode.width as number,
                      incomingNode.position.x,
                      node.width as number,
                      nodeChange.positionAbsolute!.x,
                    );

                  const sourceHandle = `${
                    edgeConfig!.sourceKey
                  }-${sourcePosition}`;
                  const targetHandle = `${
                    edgeConfig!.targetKey
                  }-${targetPosition}`;

                  ed.sourceHandle = sourceHandle;
                  ed.targetHandle = targetHandle;
                  ed.className = edgeClassName(edgeConfig, targetPosition);
                  ed.markerEnd = edgeMarkerName(edgeConfig, targetPosition);
                }

                return ed;
              }),
            );
          }
        });

        const outgoingNodes = getOutgoers(node, nodes, edges);
        // biome-ignore lint/complexity/noForEach: <explanation>
        outgoingNodes.forEach((targetNode) => {
          const edge = edges.find((edge) => {
            return edge.id === `${node.id}-${targetNode.id}`;
          });

          const edgeConfig = currentDatabase.edgeConfigs.find(
            (edgeConfig: EdgeConfig) => {
              return (
                edgeConfig.source === nodeChange.id &&
                edgeConfig.target === targetNode.id
              );
            },
          );

          if (nodeChange.positionAbsolute?.x) {
            setEdges((eds) =>
              eds.map((ed) => {
                if (edge && ed.id === edge.id) {
                  const sourcePosition =
                    edgeConfig!.sourcePosition ||
                    calculateSourcePosition(
                      node.width as number,
                      nodeChange.positionAbsolute!.x,
                      targetNode.width as number,
                      targetNode.position.x,
                    );
                  const targetPosition =
                    edgeConfig!.targetPosition ||
                    calculateTargetPosition(
                      node.width as number,
                      nodeChange.positionAbsolute!.x,
                      targetNode.width as number,
                      targetNode.position.x,
                    );

                  const sourceHandle = `${
                    edgeConfig!.sourceKey
                  }-${sourcePosition}`;
                  const targetHandle = `${
                    edgeConfig!.targetKey
                  }-${targetPosition}`;

                  ed.sourceHandle = sourceHandle;
                  ed.targetHandle = targetHandle;
                  ed.className = edgeClassName(edgeConfig, targetPosition);
                  ed.markerEnd = edgeMarkerName(edgeConfig, targetPosition);
                }

                return ed;
              }),
            );
          }
        });
      }
    });

    onNodesChange(nodeChanges);
  });

  const toggleFullScreen = useMemoizedFn(() => {
    if (fullscreenOn) {
      document
        .exitFullscreen()
        .then(() => {
          setFullScreen(false);
        })
        .catch((error) => {
          alert("Can't exit fullscreen");
          console.error(error);
        });
    } else {
      // biome-ignore lint/correctness/noInnerDeclarations: <explanation>
      var element = document.querySelector("body");

      // make the element go to full-screen mode
      element
        ?.requestFullscreen()
        .then(() => {
          setFullScreen(true);
        })
        .catch((error) => {
          alert("Can't turn on fullscreen");
          console.error(error);
        });
    }
  });

  // https://stackoverflow.com/questions/16664584/changing-an-svg-markers-color-css
  return (
    <div className="Flow">
      <Markers />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onInit={onInit}
        snapToGrid={true}
        fitView
        snapGrid={[16, 16]}
        nodeTypes={nodeTypes}
        onNodeMouseEnter={onNodeMouseEnter}
        onNodeMouseLeave={onNodeMouseLeave}
        onSelectionChange={onSelectionChange}
      >
        <Controls showInteractive={false}>
          <ControlButton onClick={toggleFullScreen}>
            {!fullscreenOn && <MaximizeIcon />}
            {fullscreenOn && <MinimizeIcon />}
          </ControlButton>
        </Controls>
        <Background color="#aaa" gap={16} />
      </ReactFlow>
    </div>
  );
};

export default SchemaDiagram;
