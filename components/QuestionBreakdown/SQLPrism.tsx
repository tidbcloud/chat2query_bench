import { sql } from "@codemirror/lang-sql";
import { tags as t } from "@lezer/highlight";
import { Box, Button, Group, Modal, ScrollArea, Stack } from "@tidbcloud/uikit";
import { useDisclosure } from "@tidbcloud/uikit/hooks";
import { IconPlayCircle } from "@tidbcloud/uikit/icons";
import { createTheme } from "@uiw/codemirror-themes";
import CodeMirror from "@uiw/react-codemirror";
import { useMemoizedFn } from "ahooks";
import { useState } from "react";
import { format } from "sql-formatter";

import { useLargeScreen } from "~/utils/useLargeScreen";

import { Prism } from "./Prism";

const formatCode = (s: string) => {
  try {
    return format(s ?? "");
  } catch {
    return s ?? "";
  }
};

const theme = createTheme({
  theme: "light",
  settings: {
    background: "#FFFFFF",
    foreground: "#000000",
    caret: "#009AE5",
    selection: "#0ca6f21a",
    selectionMatch: "transparent",
    gutterBackground: "#ffffff",
    gutterForeground: "#999",
    lineHighlight: "#0ca6f20d",
  },
  styles: [
    {
      tag: [t.meta, t.comment],
      color: "#3BAF6D",
    },
    {
      tag: [t.keyword, t.strong],
      color: "#009AE6",
    },
    {
      tag: [t.number],
      color: "#EB4799",
    },
    {
      tag: [t.string],
      color: "#EB4799",
    },
    {
      tag: [t.variableName],
      color: "#056142",
    },
    {
      tag: [t.escape],
      color: "#40BF6A",
    },
    {
      tag: [t.tagName],
      color: "#2152C4",
    },
    {
      tag: [t.heading],
      color: "#2152C4",
    },
    {
      tag: [t.quote],
      color: "#333333",
    },
    {
      tag: [t.list],
      color: "#C20A94",
    },
    {
      tag: [t.documentMeta],
      color: "#999999",
    },
    {
      tag: [t.function(t.variableName)],
      color: "#1A0099",
    },
    {
      tag: [t.definition(t.typeName), t.typeName],
      color: "#6D79DE",
    },
  ],
});

interface SQLPrismProps {
  code: string;
}

export function SQLPrism({ code }: SQLPrismProps) {
  const [value, setValue] = useState(() => formatCode(code));
  const [opened, handlers] = useDisclosure();
  const largeScreen = useLargeScreen();

  const onChange = useMemoizedFn((value: string) => {
    setValue(value);
  });

  const onRunCode = useMemoizedFn(() => {
    handlers.close();
  });

  return (
    <>
      <Box sx={{ position: "relative" }} className="sql-prism">
        <ScrollArea h={300}>
          <Prism>{value}</Prism>
        </ScrollArea>
      </Box>

      <Modal
        opened={opened}
        onClose={handlers.close}
        size={largeScreen ? "80%" : "100%"}
        title="Edit SQL"
        centered
      >
        <Stack spacing={4} w="100%">
          <Box
            sx={{
              overflow: "hidden",
              borderRadius: 8,
            }}
          >
            <CodeMirror
              autoFocus
              value={value}
              onChange={onChange}
              height="400px"
              extensions={[sql()]}
              theme={theme}
              basicSetup={{
                autocompletion: false,
              }}
            />
          </Box>
          <Group position="right">
            <Button
              variant="default"
              size="xs"
              onClick={() => setValue(formatCode(value))}
            >
              Format
            </Button>
            <Button
              variant="default"
              size="xs"
              onClick={() => setValue(formatCode(code))}
            >
              Reset
            </Button>
            <Button size="xs" leftIcon={<IconPlayCircle />} onClick={onRunCode}>
              Run
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
