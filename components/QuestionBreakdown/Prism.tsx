import { Prism as PrismHighlighter } from "@tidbcloud/uikit";

export function Prism({ children, bg }: { children: string; bg?: string }) {
  return (
    <PrismHighlighter
      language="sql"
      styles={(theme) => ({
        root: {
          backgroundColor: bg || "#fff",
          borderRadius: 16,
          paddingTop: 8,
        },
        code: {
          backgroundColor: "transparent !important",
          wordBreak: "break-all",
          padding: 0,
        },
        line: {
          padding: "0 0 0 16px",
          whiteSpace: "pre",
          color: theme.colors.gray[9],
          width: "unset",
        },
        lineContent: {
          whiteSpace: "pre-wrap",
        },
      })}
    >
      {children}
    </PrismHighlighter>
  );
}
