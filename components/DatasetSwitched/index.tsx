import { Anchor, Stack, Typography } from "@tidbcloud/uikit";
import { useMemo } from "react";

import { SAMPLE_DATASET_INTRODUCTION } from "~/components/SampleDatasetIntroduction";
import { actions, useAppDispatch, useAppSelector } from "~/store";
import { getDatabaseUnderstandingMessage } from "~/utils/constants";

export interface DatasetSwitchedMessageProps {
  meta: { dbName: string; isSample: boolean };
}

export function DatasetSwitched({ meta }: DatasetSwitchedMessageProps) {
  const dispatch = useAppDispatch();
  const sessionId = useAppSelector(
    (state) => state.session.currentConversationId,
  );
  const db = useMemo(() => {
    if ("dbName" in meta) {
      return meta.dbName;
    }
    return "";
  }, [meta]);

  return (
    <Stack align="flex-start" spacing={4}>
      <Typography>
        Dataset <b>{db}</b> is loaded.
      </Typography>

      {meta.isSample ? SAMPLE_DATASET_INTRODUCTION[db] : null}

      <Typography>
        You can ask anything about this dataset or you can try:
      </Typography>

      <Typography fw={700}>
        <Anchor
          size="sm"
          h={24}
          p={0}
          onClick={() => {
            dispatch(
              actions.session.understandDatabaseRequested({
                message: getDatabaseUnderstandingMessage,
                id: sessionId,
              }),
            );
          }}
        >
          {getDatabaseUnderstandingMessage}
        </Anchor>
      </Typography>
    </Stack>
  );
}
