import { IconArrowRight } from "@tabler/icons-react";
import {
  Anchor,
  Badge,
  Box,
  Group,
  Highlight,
  Stack,
  Typography,
} from "@tidbcloud/uikit";

import { DatabaseUnderstandingV2, isQuestionSuggestions } from "~/server/api";
import { actions, useAppDispatch, useAppSelector } from "~/store";
import { selectCurrentSession } from "~/store/selector";

export function DataSummary({ db }: { db: DatabaseUnderstandingV2 }) {
  const dispatch = useAppDispatch();
  const sessionId = useAppSelector(
    (state) => state.session.currentConversationId,
  );
  const currentSession = useAppSelector(selectCurrentSession);

  return (
    <Stack spacing={8}>
      <Typography variant="headline-sm">About Dataset</Typography>
      <Typography>{db.summary}</Typography>

      <Typography variant="headline-sm">Description</Typography>
      <Typography size={14}>
        <Highlight
          highlight={db.keywords}
          highlightStyles={() => ({
            fontWeight: 700,
            backgroundColor: "transparent",
          })}
        >
          {db.description.system}
        </Highlight>
      </Typography>

      <Typography variant="headline-sm">Keywords</Typography>
      <Group spacing={4}>
        {Array.from(new Set(db.keywords)).map((i) => (
          <Badge key={i}>{i}</Badge>
        ))}
      </Group>

      {!currentSession.isSample && (
        <>
          <Typography variant="headline-sm">
            Not satisfied with this summary?
          </Typography>
          <div>
            <Anchor
              onClick={() => {
                dispatch(
                  actions.session.understandDatabaseRequested({
                    message: "Regenerate data summary",
                    id: sessionId,
                    refresh: true,
                  }),
                );
              }}
            >
              Click here to regenerate database summary
            </Anchor>
          </div>
        </>
      )}

      {(currentSession?.suggestions?.length ?? 0) > 0 &&
        isQuestionSuggestions(currentSession.suggestions) && (
          <Stack spacing={8}>
            <Typography variant="headline-sm">
              You may want to ask ...
            </Typography>
            {currentSession.suggestions?.slice(0, 3).map((i) => (
              <Anchor
                key={i}
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 4,
                }}
                onClick={() => {
                  dispatch(
                    actions.session.userPromptSubmitted({
                      prompt: i,
                      id: sessionId,
                    }),
                  );
                }}
              >
                <Box
                  component={IconArrowRight}
                  size={16}
                  sx={{ flexShrink: 0, marginTop: 4 }}
                />
                {i}
              </Anchor>
            ))}
          </Stack>
        )}
    </Stack>
  );
}
