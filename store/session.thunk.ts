import { createAsyncThunk } from "@reduxjs/toolkit";

import { match } from "ts-pattern";

import {
  Chat2DataBreakdownAnswer,
  Chat2DataResolvedAnswer,
  DatabaseUnderstandingV2,
  type QuestionSuggestions,
  isBreakdownAnswer,
  isQuestionSuggestions,
} from "~/server/api";
import { LoadingMessages } from "~/utils/constants";
import {
  DatabaseUnderstandingMessage,
  QuestionBreakdownMessage,
} from "~/utils/message";
import { trpcClient } from "~/utils/trpc.vanilla";

import { Message, actions as messageActions } from "./messages.slice";
import { selectSessionLatestMessage } from "./selector";
import { MessageOptions, actions as sessionActions } from "./session.slice";
import { DEFAULT_CONVO_NAME, pollingJob } from "./utils";

import { notifier } from "@tidbcloud/uikit";
import type { AppDispatch, RootState } from ".";

export const userPromptSubmitted = createAsyncThunk<
  void,
  { prompt: string; id: string },
  {
    dispatch: AppDispatch;
    state: RootState;
  }
>("session/userPromptSubmitted", async ({ prompt, id }, thunkAPI) => {
  const convoId = id;
  const userPromptAction = sessionActions.receivedMessage(prompt, convoId, {
    isUser: true,
  });
  const userPromptMessage = userPromptAction.payload.message;
  thunkAPI.dispatch(userPromptAction);

  const createLoaderPlaceholderAnswer = (options?: MessageOptions) => {
    const loaderAction = sessionActions.receivedMessage("", convoId, {
      isLoading: true,
      ancestors: [userPromptMessage.id],
      ...options,
    });
    thunkAPI.dispatch(loaderAction);
    return loaderAction;
  };

  const loaderAction = createLoaderPlaceholderAnswer();
  const rootMessageId = loaderAction.payload.message.id;
  const state = thunkAPI.getState();
  let currentSession = state.session.map[convoId];

  if (!currentSession) {
    return;
  }

  if (!currentSession.sessionId) {
    try {
      const dbSummary = await trpcClient.getDataSummary.query({
        convoId: convoId,
      });

      if (dbSummary.result.status !== "done") {
        thunkAPI.dispatch(
          messageActions.editMessage({
            ...loaderAction.payload.message,
            content:
              dbSummary.msg ||
              "Still exploring database in order to provide better insights, please wait a moment.",
            isLoading: false,
          }),
        );
        return;
      }
    } catch (e) {
      if (e instanceof Error) {
        thunkAPI.dispatch(
          messageActions.editMessage({
            ...loaderAction.payload.message,
            content: e.message,
            isLoading: false,
          }),
        );
      }
    }

    try {
      const result = await trpcClient.createSession.mutate({
        convoId: currentSession.id,
      });

      thunkAPI.dispatch(
        sessionActions.updateConversation({
          id: currentSession.id,
          sessionId: result.sessionId,
        }),
      );
    } catch (e: any) {
      thunkAPI.dispatch(
        messageActions.editMessage({
          ...loaderAction.payload.message,
          content: `Create session failed, ${e.message}`,
          isLoading: false,
        }),
      );
    }
  }

  try {
    const state = thunkAPI.getState();
    const currentSession = state.session.map[convoId];
    const data = await trpcClient.breakdownUserQuestion.query(
      {
        q: prompt,
        sessionId: currentSession.sessionId!,
        convoId: currentSession.id,
      },
      { signal: thunkAPI.signal },
    );

    if (data.code !== 200) {
      thunkAPI.dispatch(
        messageActions.editMessage({
          ...loaderAction.payload.message,
          content: data.msg ?? "",
          isLoading: false,
          isRoot: true,
        }),
      );
      return;
    }

    const id = data.result.job_id;

    const ancestorsMap = new Map(); // taskiId -> ancestors message id list
    const map = new Map(); // task id -> message id

    // polling root answer
    for await (const [res, err] of pollingJob(id, currentSession.id)) {
      const insertMessage = (
        content: string,
        options: MessageOptions,
      ): Message => {
        const action = sessionActions.receivedMessage(
          content,
          convoId,
          options,
        );
        thunkAPI.dispatch(action);
        return action.payload.message;
      };

      const updateMessage = (
        content: string,
        options: MessageOptions,
      ): Message => {
        const payload = { ...options, content };
        const action = messageActions.editMessage(payload as Message);
        thunkAPI.dispatch(action);
        return action.payload;
      };

      const upsertMessage = (
        content: string,
        options: MessageOptions,
      ): Message => {
        const id = options.id;
        if (id) {
          return updateMessage(content, options);
        }

        return insertMessage(content, options);
      };

      // handle error occured for root
      if (!res || err) {
        upsertMessage((err as Error).message, {
          id: rootMessageId,
          ancestors: [userPromptMessage.id],
          isRoot: true,
          isStreaming: false,
        });
        continue;
      }

      if (res.code !== 200) {
        upsertMessage(data.msg ?? "", {
          id: rootMessageId,
          ancestors: [userPromptMessage.id],
          isRoot: true,
          isStreaming: false,
          isLoading: false,
        });
        break;
      }

      const status = res.result.status;
      const result = res.result.result as
        | Chat2DataResolvedAnswer
        | Chat2DataBreakdownAnswer;

      // handle root answer (breakdown or single)
      match(status)
        .with("running", () => {
          return upsertMessage(QuestionBreakdownMessage, {
            id: rootMessageId,
            isStreaming: true,
            isRoot: true,
            isLoading: false,
            meta: result,
            ancestors: [userPromptMessage.id],
          });
        })
        .with("failed", () => {
          return upsertMessage(res.result.reason ?? "Unknown reason", {
            id: rootMessageId,
            isStreaming: false,
            isRoot: true,
            isLoading: false,
            meta: result,
            ancestors: [userPromptMessage.id],
          });
        })
        .with("done", () => {
          return upsertMessage(QuestionBreakdownMessage, {
            id: rootMessageId,
            isStreaming: false,
            isRoot: true,
            isLoading: false,
            meta: result,
            ancestors: [userPromptMessage.id],
          });
        })
        .run();

      ancestorsMap.set("0", [rootMessageId]);
      map.set("0", rootMessageId);

      if (isBreakdownAnswer(result)) {
        for (const subtask of result.sub_tasks) {
          if (map.get(subtask.task_id)) {
            continue;
          }
          if (subtask.status !== "done") {
            continue;
          }

          const parentTask = subtask.task_id.split("-").slice(0, -1).join("-");
          const options = {
            meta: subtask,
            isStreaming: false,
            isLeaf: true,
            ancestors: [userPromptMessage.id, ...ancestorsMap.get(parentTask)],
          };

          const m = insertMessage(QuestionBreakdownMessage, {
            ...options,
          });
          map.set(subtask.task_id, m.id);
          ancestorsMap.set(subtask.task_id, m.ancestors);
        }
      }
    }
  } catch (e) {
    if (e instanceof Error) {
      thunkAPI.dispatch(sessionActions.receivedMessage(e.message, convoId));
    }
  }
});

export const understandDatabaseRequested = createAsyncThunk<
  void,
  { message: string; id: string; refresh?: boolean },
  {
    dispatch: AppDispatch;
    state: RootState;
  }
>(
  "session/understandDatabaseRequested",
  async ({ message, id, refresh }, thunkAPI) => {
    const startTime = Date.now();
    let lastCheckTime = startTime;
    let loadingMessageIndex = 0;

    const convoId = id;
    const userAction = sessionActions.receivedMessage(message, convoId, {
      isUser: true,
    });
    thunkAPI.dispatch(userAction);

    const loaderAction = sessionActions.receivedMessage("", convoId, {
      isLoading: true,
      ancestors: [userAction.payload.message.id],
    });
    thunkAPI.dispatch(loaderAction);

    if (refresh) {
      const data = await trpcClient.refreshDataSummary.mutate({
        convoId: convoId,
      });
      thunkAPI.dispatch(
        sessionActions.updateConversation({
          id: convoId,
          dbSummaryId: data.dbSummaryId,
          dbSummaryJobId: data.jobId,
        }),
      );
    }

    const state = thunkAPI.getState();
    const currentSession = state.session.map[convoId];
    const jobId = currentSession.dbSummaryJobId!;

    for await (const [res, err] of pollingJob(jobId, convoId)) {
      if (!res || err) {
        thunkAPI.dispatch(
          messageActions.editMessage({
            ...loaderAction.payload.message,
            content: (err as Error).message,
            isLoading: false,
            ancestors: [userAction.payload.message.id],
          }),
        );
        return;
      }
      const passedTime = Date.now() - lastCheckTime;
      if (passedTime > 10000 * (loadingMessageIndex + 1)) {
        lastCheckTime = Date.now();
        const lastMessage = selectSessionLatestMessage(
          thunkAPI.getState(),
          convoId,
        );
        if (lastMessage?.isLoading) {
          thunkAPI.dispatch(
            messageActions.editMessage({
              ...lastMessage,
              content: LoadingMessages[loadingMessageIndex],
            }),
          );
          loadingMessageIndex++;
          if (loadingMessageIndex === LoadingMessages.length) {
            loadingMessageIndex = 0;
          }
        }
      }

      const status = res.result.status;
      match(status)
        .with("failed", () => {
          thunkAPI.dispatch(
            messageActions.editMessage({
              ...loaderAction.payload.message,
              content: res.result.reason ?? "Unknown reason",
              isLoading: false,
              ancestors: [userAction.payload.message.id],
            }),
          );
        })
        .with("done", () => {
          thunkAPI.dispatch(
            messageActions.editMessage({
              ...loaderAction.payload.message,
              content: DatabaseUnderstandingMessage,
              isLoading: false,
              meta: res.result.result as DatabaseUnderstandingV2,
              ancestors: [userAction.payload.message.id],
            }),
          );

          thunkAPI.dispatch(fetchQuestionSuggestions({ convoId: convoId }));
        });
    }
  },
);

export const fetchQuestionSuggestions = createAsyncThunk<
  void,
  { convoId: string },
  {
    dispatch: AppDispatch;
    state: RootState;
  }
>("session/fetchQuestionSuggestions", async ({ convoId }, thunkAPI) => {
  const lastMessage = selectSessionLatestMessage(thunkAPI.getState(), convoId);

  if (!lastMessage) {
    return;
  }

  thunkAPI.dispatch(
    messageActions.editMessage({
      ...lastMessage,
      isStreaming: true,
    }),
  );

  const finish = (suggestions?: QuestionSuggestions) => {
    thunkAPI.dispatch(
      messageActions.editMessage({
        ...lastMessage,
        isStreaming: false,
        meta: {
          ...lastMessage.meta!,
        },
      }),
    );

    thunkAPI.dispatch(
      sessionActions.updateConversation({ id: convoId, suggestions }),
    );

    if (suggestions?.length) {
      trpcClient.saveSuggestion.mutate({
        convoId,
        suggestions,
      });
    }
  };

  try {
    const data = await trpcClient.getSuggestQuestion.mutate({
      id: convoId,
    });

    if (!("job_id" in data.result)) {
      finish(data?.result?.suggestions);
      return;
    }

    const id = data.result.job_id;
    if (id) {
      for await (const [res, err] of pollingJob(id, convoId)) {
        if (err) {
          finish();
          return;
        }
        const status = res?.result.status;
        match(status)
          .with("done", () => {
            if (isQuestionSuggestions(res?.result.result)) {
              finish(res?.result.result);
            } else {
              finish();
            }
          })
          .with("failed", () => {
            finish();
          });
      }
    }
  } catch (e) {
    finish();
  }
});

export const createNewConversation = createAsyncThunk<
  void,
  void,
  {
    dispatch: AppDispatch;
    state: RootState;
  }
>("session/createNewConversation", async (_, thunkApi) => {
  try {
    const data = await trpcClient.createConversation.mutate({
      name: DEFAULT_CONVO_NAME,
    });

    thunkApi.dispatch(
      sessionActions.saveNewConversation({
        convo: {
          id: data.id,
          messages: [],
          createdTs: new Date(data.createdAt).valueOf(),
          updatedTs: new Date(data.updatedAt).valueOf(),
          name: data.name,
          isSample: false,
        },
      }),
    );

    thunkApi.dispatch(sessionActions.switchConversation(data.id));
  } catch (e: any) {
    notifier.error("Failed to create new conversation,", e.message);
  }
});
