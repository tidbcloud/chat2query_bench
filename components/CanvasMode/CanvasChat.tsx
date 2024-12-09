import "reactflow/dist/style.css";
import {
  ActionIcon,
  Box,
  Card,
  Group,
  LoadingOverlay,
  Tooltip,
  Typography,
  useMantineTheme,
} from "@tidbcloud/uikit";
import {
  IconChevronLeft,
  IconChevronRight,
  IconCompass03,
  IconMagicWand02,
  IconMaximize02,
  IconMinus,
  IconPlus,
} from "@tidbcloud/uikit/icons";
import { useMemoizedFn, usePrevious, useUpdateEffect } from "ahooks";
import { differenceBy } from "lodash-es";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  useReactFlow,
  Panel,
  useNodesInitialized,
  useOnSelectionChange,
} from "reactflow";
import { match } from "ts-pattern";

import { isDatabaseUnderstanding } from "~/server/api";
import { actions, useAppDispatch, useAppSelector } from "~/store";
import { MessageFlow, MessageFlowNode } from "~/store/messages.slice";
import {
  selectCurrentSession,
  selectCurrentSessionFlow,
} from "~/store/selector";
import { Conversation } from "~/store/utils";
import { getDatabaseUnderstandingMessage } from "~/utils/constants";
import { searchTree } from "~/utils/tree";

import { Introduction } from "../Introduction";
import { FloatingUserInput } from "../UserInput";

import { IconCircleDot } from "@tabler/icons-react";
import { CustomDBSchemaNode } from "./CustomDBSchemaNode";
import { CustomDBSummaryNode } from "./CustomDBSummaryNode";
import { CustomNode } from "./CustomNode";
import { getLayoutedElements } from "./layout";

export const RootNodeId = "RootNode";
const CustomMessageNodeType = "message";
const CustomDBSchemaNodeType = "db-schema";
const CustomDBEntityNodeType = "db-entity";
const CustomDBSummaryNodeType = "db-summary";

function useFlowToArray(flow: MessageFlow) {
  const messages = useAppSelector((s) => s.messages.raw);

  return useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    function traverse(
      node: MessageFlowNode,
      parent: MessageFlowNode | null,
      rank: number,
    ) {
      const m = messages[node.id];
      if (
        isDatabaseUnderstanding(m?.meta) ||
        // db understanding is loading
        (m?.isLoading &&
          m?.ancestors?.at(0) &&
          messages[m.ancestors.at(0)!]?.content.includes(
            getDatabaseUnderstandingMessage,
          ))
      ) {
        nodes.push(
          ...[
            CustomDBSummaryNodeType,
            CustomDBEntityNodeType,
            CustomDBSchemaNodeType,
          ].map((type) => {
            const id = `${node.id}-${type}`;
            return {
              id,
              data: {
                id: node.id,
                rank: rank,
                label: id,
                parent: parent?.id,
              },
              position: { x: 0, y: 0 },
              type,
            };
          }),
        );

        edges.push(
          ...[
            CustomDBSummaryNodeType,
            CustomDBEntityNodeType,
            CustomDBSchemaNodeType,
          ].map((i) => ({
            id: `${parent?.id}-${node.id}-${i}`,
            source: parent?.id!,
            target: `${node.id}-${i}`,
            animated: true,
            type: "smoothstep",
          })),
        );

        return;
      }

      nodes.push({
        id: node.id,
        data: { id: node.id, rank: rank, label: node.id, parent: parent?.id },
        position: { x: 0, y: 0 },
        type: CustomMessageNodeType,
      });

      if (node.children) {
        for (const child of node.children) {
          const m = messages[child.id];
          if (m && !isDatabaseUnderstanding(m.meta)) {
            edges.push({
              id: `${node.id}-${child.id}`,
              source: node.id,
              target: child.id,
              animated: true,
              type: "smoothstep",
            });
          }
          traverse(child, node, rank + 1);
        }
      }
    }

    traverse({ id: RootNodeId, children: flow }, null, 0);

    return { nodes, edges };
  }, [messages, flow]);
}

function getDataDisplayName(currentSession: Conversation) {
  if (currentSession?.dbName) {
    return (
      <span>
        Using database <b>{currentSession?.dbName}</b>
      </span>
    );
  }
  return null;
}

const nodeTypes = {
  [CustomMessageNodeType]: CustomNode,
  [CustomDBSummaryNodeType]: CustomDBSummaryNode,
  // [CustomDBEntityNodeType]: CustomDBEntityNode,
  [CustomDBSchemaNodeType]: CustomDBSchemaNode,
};

export function CanvasChat() {
  const theme = useMantineTheme();
  const dispatch = useAppDispatch();
  const currentSession = useAppSelector(selectCurrentSession);
  const previousSession = usePrevious(currentSession);

  const name = useMemo(
    () => getDataDisplayName(currentSession),
    [currentSession],
  );
  const flow = useAppSelector(selectCurrentSessionFlow);
  const selected = useAppSelector((s) => s.messages.selectedNodes?.at(0));
  const flattend = useFlowToArray(flow);
  const [isReady, setIsReady] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState(flattend.nodes ?? []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flattend.edges ?? []);
  const isFirstTimeIniDoneRef = useRef(false);
  const { getEdges, getNodes, setCenter, getNode, zoomIn, zoomOut, fitView } =
    useReactFlow();
  const nodesInitialized = useNodesInitialized({ includeHiddenNodes: false });

  useOnSelectionChange({
    onChange: ({ nodes }) => {
      const ids = nodes.map((n) => n.id);
      if (ids.length) {
        dispatch(actions.messages.selectNode({ nodes: ids }));
      }
    },
  });

  const onCenteringNode = useMemoizedFn(
    (
      id: string,
      options?: { offsetX?: number; offsetY?: number; zoom?: number },
    ) => {
      const node = getNode(id);
      if (node) {
        const x = options?.offsetX ?? 0;
        const y = options?.offsetY ?? 0;
        setCenter(
          node.position.x + (node.width ?? 0) / 2 + x,
          node.position.y + (node.height ?? 0) / 2 + y,
          {
            duration: 600,
            zoom: 0.7,
          },
        );
      }
    },
  );

  const layoutElements = useMemoizedFn((nodes: Node[], edges: Edge[]) => {
    const layouted = getLayoutedElements(nodes, edges);
    const layoutedNodes = [...layouted.nodes];
    const layoutedEdges = [...layouted.edges];
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  });

  const onLayout = useMemoizedFn(
    (triggerBy: "nodesAdded" | "nodesInited" | "sessionSwitch") => {
      match(triggerBy)
        .with("sessionSwitch", () => {
          setNodes(flattend.nodes);
          setEdges(flattend.edges);
        })
        .with("nodesAdded", () => {
          // only add nodes here, re-layout happens only after initialized
          setNodes((prev) => {
            const diffNodes = differenceBy(flattend.nodes, prev, (o) => o.id);
            return [...prev, ...diffNodes];
          });
          setEdges((prev) => {
            const diffEdges = differenceBy(flattend.edges, prev, (o) => o.id);
            return [...prev, ...diffEdges];
          });
        })
        .with("nodesInited", () => {
          const nodes = getNodes();
          const edges = getEdges();
          layoutElements(nodes, edges);
          window.requestAnimationFrame(() => {
            setIsReady(true);
            window.requestIdleCallback(() => {
              if (!isFirstTimeIniDoneRef.current) {
                isFirstTimeIniDoneRef.current = true;
              }
              if (previousSession?.id === currentSession?.id) {
                const last = nodes.at(-1)?.id;
                if (last) {
                  onCenteringNode(last, { zoom: 0.5 });
                }
              } else {
                onCenteringNode(RootNodeId, { offsetY: 400, zoom: 0.5 });
              }
            });
          });
        })
        .exhaustive();
    },
  );

  useEffect(() => {
    if (nodesInitialized) {
      window.requestIdleCallback(() => {
        onLayout("nodesInited");
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodesInitialized, onLayout]);

  useUpdateEffect(() => {
    window.requestAnimationFrame(() => {
      setIsReady(false);
    });
  }, [currentSession?.id]);

  useUpdateEffect(() => {
    window.requestIdleCallback(() => {
      if (previousSession?.id === currentSession?.id) {
        onLayout("nodesAdded");
      } else {
        onLayout("sessionSwitch");
      }
    });
  }, [flattend.nodes.length]);

  const panels = [
    {
      label: "Switch to chat mode",
      icon: <IconCircleDot size={16} />,
      show: true,
      onClick: () => dispatch(actions.session.switchMode({ mode: "chat" })),
    },
    {
      label: "Zoom in",
      icon: <IconPlus />,
      show: true,
      onClick: () => zoomIn({ duration: 200 }),
    },
    {
      label: "Zoom out",
      icon: <IconMinus />,
      show: true,
      onClick: () => zoomOut({ duration: 200 }),
    },
    {
      label: "Fit view",
      icon: <IconMaximize02 />,
      show: true,
      onClick: () => fitView({ duration: 200 }),
    },
    {
      label: "Focus on selected",
      onClick: () => {
        if (selected) {
          onCenteringNode(selected);
        }
      },
      icon: <IconCompass03 />,
      show: true,
    },
    {
      label: "Focus on root",
      onClick: () => {
        onCenteringNode(RootNodeId, { offsetY: 400, zoom: 0.5 });
      },
      icon: <IconMagicWand02 />,
      show: true,
    },
    {
      label: "Previous node",
      icon: <IconChevronLeft />,
      show: true,
      onClick: () => {
        if (!selected) return;
        const { parent } = searchTree(
          { id: RootNodeId, children: flow },
          selected,
        );
        if (!parent || !parent.children) return;

        // if selected is the first child, go to his parent
        // otherwise, go to his prev sibling
        if (parent.children?.at(0)?.id === selected) {
          dispatch(actions.messages.selectNode({ nodes: [parent.id] }));
          onCenteringNode(parent.id);
        } else {
          const i = parent.children.findIndex((i) => i.id === selected);
          const prevSibling = parent.children.at(i - 1);
          if (prevSibling) {
            dispatch(actions.messages.selectNode({ nodes: [prevSibling.id] }));
            onCenteringNode(prevSibling.id);
          }
        }
      },
    },
    {
      label: "Next node",
      icon: <IconChevronRight />,
      show: true,
      onClick: () => {
        if (!selected) return;
        const { parent, node } = searchTree(
          { id: RootNodeId, children: flow },
          selected,
        );
        if (!parent || !parent.children) return;

        // if selected is not the last child, go to his next sibling
        // otherwise, try go to his first child
        if (parent.children?.at(-1)?.id !== selected) {
          const i = parent.children.findIndex((i) => i.id === selected);
          const nextSibling = parent.children.at(i + 1);
          if (nextSibling) {
            dispatch(actions.messages.selectNode({ nodes: [nextSibling.id] }));
            onCenteringNode(nextSibling.id);
          }
        } else if (node?.children) {
          const firstChild = node.children.at(0);
          if (firstChild) {
            dispatch(actions.messages.selectNode({ nodes: [firstChild.id] }));
            onCenteringNode(firstChild.id);
          }
        }
      },
    },
  ];

  return (
    <Box
      className="app-canvas-chat"
      sx={{
        flexGrow: 1,
        width: "100%",
        "& .react-flow__node": { maxWidth: 640 },
        "& .react-flow__node-message": { backgroundColor: "transparent" },
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodesDraggable={false}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        minZoom={0.1}
        panOnScroll
        fitView
        style={{
          backgroundColor: theme.fn.rgba(theme.colors.gray[3], 0.2),
        }}
      >
        <LoadingOverlay
          visible={
            (!isReady && Boolean(currentSession?.dbSummaryId)) ||
            (currentSession?.creating ?? false)
          }
          overlayOpacity={1}
          overlayBlur={1}
        />

        {name && (
          <Panel position="top-right">
            <Typography variant="label-lg">{name}</Typography>
          </Panel>
        )}

        {currentSession?.dbSummaryId && (
          <Panel position="top-left">
            <Card shadow="sm" style={{ padding: 8 }}>
              <Group>
                {panels
                  .filter((i) => i.show)
                  .map((i) => (
                    <Tooltip
                      key={i.label}
                      label={<Typography fz="xs">{i.label}</Typography>}
                      withinPortal
                      withArrow
                    >
                      <ActionIcon variant="light" onClick={i.onClick}>
                        {i.icon}
                      </ActionIcon>
                    </Tooltip>
                  ))}
              </Group>
            </Card>
          </Panel>
        )}

        {!currentSession?.dbSummaryId && (
          <Panel position="top-center" style={{ width: "100%" }}>
            <Introduction isCanvasMode={true} />
          </Panel>
        )}

        {Boolean(currentSession?.dbSummaryId) && <FloatingUserInput />}
      </ReactFlow>
    </Box>
  );
}
