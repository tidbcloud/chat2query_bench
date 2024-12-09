import { IconPlus } from "@tabler/icons-react";
import {
  Box,
  Card,
  Modal,
  SimpleGrid,
  Stack,
  Transition,
  Typography,
} from "@tidbcloud/uikit";
import { useDisclosure } from "@tidbcloud/uikit/hooks";
import { useMemoizedFn } from "ahooks";
import { useEffect } from "react";

import { actions } from "~/store";
import { useAppDispatch, useAppSelector } from "~/store";
import { selectCurrentSession } from "~/store/selector";
import { DEFAULT_DATASET } from "~/utils/constants";
import { DatasetSwitchedMessage } from "~/utils/message";
import { trpcNextClient } from "~/utils/trpc.next";
import { useLargeScreen } from "~/utils/useLargeScreen";

import { ConnectDatabaseForm } from "./ConnectDatabaseForm";

export const DatabaseSelector = ({
  isCanvasMode,
}: { isCanvasMode?: boolean }) => {
  const largeScreen = useLargeScreen();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.account.user);
  const currentSession = useAppSelector(selectCurrentSession);
  const currentConversationId = useAppSelector(
    (s) => s.session.currentConversationId,
  );
  const bindDatabase = trpcNextClient.bindDatabase.useMutation();
  const [chooseDatasetOpened, chooseDatasethandlers] = useDisclosure();
  const [opened, handlers] = useDisclosure();

  const onSubmit = useMemoizedFn(async (values: { dataset: string }) => {
    // if use db_uri, the loading indicator will be the button
    const loaderAction = actions.session.receivedMessage(
      "",
      currentConversationId,
      {
        isLoading: true,
      },
    );
    dispatch(loaderAction);

    try {
      chooseDatasethandlers.close();

      dispatch(
        actions.session.updateConversation({
          id: currentConversationId,
          creating: true,
          isSample: true,
          sampleDbName: values.dataset,
        }),
      );
      const data = await bindDatabase.mutateAsync({
        dataset: values.dataset,
        id: currentConversationId,
      });

      dispatch(
        actions.session.bindDatabaseSummary({
          id: currentConversationId,
          creating: false,
          context: data!,
        }),
      );

      dispatch(
        actions.messages.editMessage({
          ...loaderAction.payload.message,
          isLoading: false,
          content: DatasetSwitchedMessage,
          meta: {
            dbName: data?.dbName!,
            isSample: true,
          },
        }),
      );
    } catch (e) {
      if (e instanceof Error) {
        dispatch(
          actions.messages.editMessage({
            ...loaderAction.payload.message,
            isLoading: false,
            content: e.message,
          }),
        );
      }
    }
  });

  useEffect(() => {
    if (currentSession?.dbSummaryJobId || currentSession?.dbSummaryId) {
      chooseDatasethandlers.close();
    } else {
      chooseDatasethandlers.open();
    }
  }, [
    currentSession?.dbSummaryJobId,
    currentSession?.dbSummaryId,
    chooseDatasethandlers,
  ]);

  return (
    <>
      <Transition
        mounted={chooseDatasetOpened}
        transition="slide-up"
        duration={300}
        timingFunction="ease"
      >
        {(styles) => (
          <Stack
            className="dataset-selector"
            style={styles}
            sx={
              largeScreen && !isCanvasMode
                ? {
                    position: "absolute",
                    bottom: 10,
                    width: "100%",
                    padding: "0 32px",
                  }
                : {
                    padding: "0 16px",
                  }
            }
          >
            <Typography variant="label-lg">
              To get started, choose a dataset below
            </Typography>

            <SimpleGrid cols={3}>
              {DEFAULT_DATASET.map((i) => (
                <Card
                  key={i.name}
                  sx={{ cursor: "pointer" }}
                  onClick={() => {
                    onSubmit({ dataset: i.name });
                  }}
                >
                  <Typography variant="label-lg" mb={largeScreen ? 0 : 8}>
                    {i.label}
                  </Typography>
                  <Typography variant="body-md">{i.desc}</Typography>
                </Card>
              ))}
              <Card
                onClick={() => {
                  if (user?.isGuest) {
                    dispatch(
                      actions.session.openModal({
                        modal: "profile",
                        modalProps: {
                          title: "Profile",
                        },
                      }),
                    );
                    return;
                  }
                  handlers.open();
                }}
                sx={{
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Typography
                  fz={16}
                  mb={largeScreen ? 0 : 8}
                  sx={{ display: "flex", alignItems: "center", gap: 4 }}
                >
                  <Box component={IconPlus} size={18} />
                  Explore your own dataset
                </Typography>
              </Card>
            </SimpleGrid>
          </Stack>
        )}
      </Transition>

      <Modal
        title="Connect to my database"
        opened={opened}
        onClose={handlers.close}
        centered
        size={700}
      >
        <ConnectDatabaseForm onClose={handlers.close} />
      </Modal>
    </>
  );
};
