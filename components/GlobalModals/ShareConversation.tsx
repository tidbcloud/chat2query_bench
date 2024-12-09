import { Button, Group, Radio, Stack, notifier } from "@tidbcloud/uikit";
import { useMemoizedFn } from "ahooks";
import { useState } from "react";
import { match } from "ts-pattern";

import { actions, useAppDispatch, useAppSelector } from "~/store";
import { selectSessionMessages } from "~/store/selector";
import { trpcNextClient } from "~/utils/trpc.next";

interface ShareConversationProps {
  sessionId: string;
  messageId: string;
}

export function ShareConversation({
  sessionId,
  messageId,
}: ShareConversationProps) {
  const dispatch = useAppDispatch();
  const sessionMessages = useAppSelector((s) =>
    selectSessionMessages(s, sessionId),
  );

  const [sharingOption, setSharingOption] = useState<"qa" | "all">("qa");
  const createLink = trpcNextClient.createPublicLink.useMutation();

  const handleCreateLink = useMemoizedFn(async () => {
    const messages = match(sharingOption)
      .with("qa", () => {
        const index = sessionMessages.findIndex((i) => i.id === messageId);
        const start = sessionMessages
          .slice(0, index)
          .findLastIndex((i) => i.isUser);
        const end =
          sessionMessages.slice(index).findIndex((i) => i.isUser) + index;
        return sessionMessages.slice(start, end < 0 ? undefined : end);
      })
      .with("all", () => sessionMessages)
      .exhaustive();

    try {
      const data = await createLink.mutateAsync({
        messageIds: messages.map((i) => i.id),
      });

      dispatch(
        actions.session.openModal({
          modal: "shareCreated",
          modalProps: {
            title: "Public link created",
            shareUrl: `${window.location.origin}/share/${data.result?.id}`,
          },
        }),
      );
    } catch (e) {
      if (e instanceof Error) {
        notifier.error(e.message);
      }
    }
  });

  return (
    <Stack>
      <Radio.Group
        label="Select what you want to share"
        value={sharingOption}
        onChange={setSharingOption as any}
      >
        <Stack>
          <Radio value="qa" label="This question & responses" />
          <Radio value="all" label="Entire chat" />
        </Stack>
      </Radio.Group>

      {!createLink.data?.result?.id && (
        <Group position="right">
          <Button
            variant="subtle"
            size="xs"
            onClick={() => {
              dispatch(actions.session.closeModal());
            }}
          >
            Cancel
          </Button>
          <Button
            variant="filled"
            size="xs"
            loading={createLink.isLoading}
            onClick={handleCreateLink}
          >
            Create public link
          </Button>
        </Group>
      )}
    </Stack>
  );
}
