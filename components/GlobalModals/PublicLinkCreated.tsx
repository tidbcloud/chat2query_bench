import { IconExternalLink } from "@tabler/icons-react";
import {
  Group,
  Typography,
  CopyButton,
  Tooltip,
  ActionIcon,
  Stack,
  Button,
} from "@tidbcloud/uikit";
import { IconCheck, IconCopy07 } from "@tidbcloud/uikit/icons";

interface PublicLinkCreatedProps {
  shareUrl: string;
}

export function PublicLinkCreated({ shareUrl }: PublicLinkCreatedProps) {
  return (
    <Stack>
      <Group
        noWrap
        position="apart"
        sx={(theme) => ({
          border: `1px solid ${theme.colors.gray[2]}`,
          backgroundColor: theme.colors.gray[2],
          borderRadius: 8,
          padding: `8px 16px`,
        })}
      >
        <Typography variant="body-lg">{shareUrl}</Typography>

        <CopyButton value={shareUrl} timeout={2000}>
          {({ copied, copy }) => (
            <Tooltip
              label={copied ? "Copied" : "Copy"}
              withArrow
              position="right"
            >
              <ActionIcon color={copied ? "teal" : "gray"} onClick={copy}>
                {copied ? <IconCheck /> : <IconCopy07 />}
              </ActionIcon>
            </Tooltip>
          )}
        </CopyButton>
      </Group>

      <Group position="right">
        <Button
          size="xs"
          variant="default"
          onClick={() => {
            window.open(shareUrl, "_blank");
          }}
          rightIcon={<IconExternalLink stroke={1.5} size={16} />}
        >
          Open in new tab
        </Button>
      </Group>
    </Stack>
  );
}
