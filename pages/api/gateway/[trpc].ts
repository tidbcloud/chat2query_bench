/**
 * This is the API-handler of your app that contains all your API routes.
 * On a bigger app, you will probably want to split this file up into multiple files.
 */
import * as Sentry from "@sentry/nextjs";
import * as trpcNext from "@trpc/server/adapters/next";
import { generateState } from "arctic";
import { parseCookies, serializeCookie } from "oslo/cookie";
import { P, match } from "ts-pattern";
import { z } from "zod";

import { TRPCError } from "@trpc/server";
import { and, eq, isNotNull } from "drizzle-orm";
import { omit } from "lodash-es";
import { generateIdFromEntropySize } from "lucia";
import {
  ApiResult,
  Chat2DataBreakdownAnswer,
  DatabaseUnderstandingV2,
  QuestionSuggestions,
  SessionContextsSessionsItem,
  isResolvedAnswer,
} from "~/server/api";
import { lucia } from "~/server/auth";
import { createContext } from "~/server/context";
import { db } from "~/server/db";
import {
  ConversationTable,
  MessageTable,
  PublicLinkTable,
  ServerlessClusterTable,
  UserSessionTable,
  UserTable,
} from "~/server/schema";
import { protectedProcedure, publicProcedure, router } from "~/server/trpc";
import { DEFAULT_CONVO_NAME } from "~/store/utils";
import { DEFAULT_DATASET } from "~/utils/constants";
import { decryptToken, encryptToken } from "~/utils/encrypt";
import { PrivateEnvVariables, SampleDatasetConfig } from "~/utils/env";
import { getDataAppHost, nodeFetch, reuseHeader } from "~/utils/fetch";
import {
  createChat2QueryAppAndKey,
  createDataAppAndKey,
  createOAuth2Client,
  getAccessToken,
  getUserClusters,
  getUserDataApps,
  getUserInfo,
  runSql,
  showDatabases,
} from "~/utils/oauth";
import { hashPassword, verifyPassword } from "~/utils/password";
import { getDbName, isSampleDataset } from "~/utils/url";

export const config = {
  api: {
    externalResolver: true,
  },
};

const getFetchOptionsFromConvo = async (convoId: string, dbUri?: string) => {
  const convo = await db.query.ConversationTable.findFirst({
    where(fields, operators) {
      return operators.eq(fields.id, convoId);
    },
  });

  console.log("convo:", convo);

  if (!convo) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Conversation not found",
    });
  }

  const isUsingDbUri = !!dbUri || !!convo.dbUri;

  if (isUsingDbUri) {
    return {
      host: SampleDatasetConfig.dataAppHost,
      auth: SampleDatasetConfig.auth,
      convo,
    };
  }

  const cluster = await db.query.ServerlessClusterTable.findFirst({
    where(fields, operators) {
      return operators.eq(fields.clusterId, convo.clusterId!);
    },
  });

  console.log("cluster:", cluster);

  return {
    host: getDataAppHost(cluster?.chat2queryAppId!, cluster?.region!),
    auth: await decryptToken(cluster?.chat2queryKey!),
    convo,
  };
};

const appRouter = router({
  hello: publicProcedure
    .input(z.string().nullish())
    .query((opts) => `hello ${opts.input ?? opts.ctx.user?.email ?? "world"}`),
  secret: protectedProcedure.query(() => {
    return {
      secret: "sauce",
    };
  }),
  createSession: protectedProcedure
    .input(
      z.object({
        convoId: z.string(),
      }),
    )
    .mutation(async (opts) => {
      const { auth, host, convo } = await getFetchOptionsFromConvo(
        opts.input.convoId,
      );

      if (!convo.dbUri && !convo.clusterId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Bind database to conversation before create session please",
        });
      }

      try {
        const session: ApiResult<SessionContextsSessionsItem> = await nodeFetch(
          "/v3/sessions",
          {
            auth,
            host,
            method: "POST",
            headers: reuseHeader(opts.ctx.request),
            body: convo.dbUri
              ? {
                  database_uri: convo.dbUri,
                }
              : {
                  cluster_id: convo.clusterId,
                  database: convo.database,
                },
          },
        );

        if (session.code === 200) {
          await db
            .update(ConversationTable)
            .set({
              sessionId: session.result.session_id,
            })
            .where(
              and(
                eq(ConversationTable.id, opts.input.convoId),
                eq(ConversationTable.userId, opts.ctx.user.id),
              ),
            );
        }

        return {
          sessionId: session.result.session_id,
        };
      } catch (e) {
        if (e instanceof Error) console.log(e);
        throw e;
      }
    }),
  queryJobDetail: publicProcedure
    .input(
      z.object({
        jobId: z.string(),
        convoId: z.string(),
      }),
    )
    .query(
      async (
        opts,
      ): Promise<
        ApiResult<{
          ended_at: number;
          job_id: string;
          reason: string;
          status: "init" | "running" | "failed" | "done";
          result:
            | DatabaseUnderstandingV2
            | Chat2DataBreakdownAnswer
            | QuestionSuggestions;
        }>
      > => {
        const { auth, host } = await getFetchOptionsFromConvo(
          opts.input.convoId,
        );

        try {
          return await nodeFetch(`/v2/jobs/${opts.input.jobId}`, {
            auth,
            host,
            headers: reuseHeader(opts.ctx.request),
          });
        } catch (e) {
          console.log("queryJobDetail error: ", e);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Error when querying job detail, please try again later",
            cause: e,
          });
        }
      },
    ),
  breakdownUserQuestion: publicProcedure
    .input(
      z.object({
        q: z.string(),
        convoId: z.string(),
        sessionId: z.number(),
        feedback_answer_id: z.string().optional(),
        feedback_task_id: z.string().optional(),
      }),
    )
    .query(async (opts): Promise<ApiResult<{ job_id: string }>> => {
      console.log("breakdownUserQuestion input: ", opts.input);

      const { auth, host } = await getFetchOptionsFromConvo(opts.input.convoId);

      try {
        return await nodeFetch(
          `/v3/sessions/${opts.input.sessionId}/chat2data`,
          {
            auth,
            host,
            method: "POST",
            headers: reuseHeader(opts.ctx.request),
            body: {
              question: opts.input.q,
              sql_generate_mode: "auto_breakdown",
              feedback_answer_id: "",
              feedback_task_id: "",
            },
          },
        );
      } catch (e) {
        console.log("breakdownUserQuestion error: ", e);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error when fetching chat2data, please try again later",
          cause: e,
        });
      }
    }),
  createPublicLink: protectedProcedure
    .input(
      z.object({
        messageIds: z.array(z.string()),
      }),
    )
    .mutation(async (opts) => {
      console.log("createPublicLink messages", opts.input);

      if (opts.input.messageIds.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No messages to share",
        });
      }

      const id = generateIdFromEntropySize(10);
      await db.insert(PublicLinkTable).values({
        id,
        userId: opts.ctx.user.id,
        messages: opts.input.messageIds,
      });

      return { code: 200, result: { id } };
    }),
  readPublicLink: publicProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async (opts) => {
      console.log("readPublicLink: ", opts.input.id);
      const publicLink = await db.query.PublicLinkTable.findFirst({
        where(fields, operators) {
          return operators.eq(fields.id, opts.input.id);
        },
      });

      if (!publicLink) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Public link not found",
        });
      }

      console.log("publicLink.messages", publicLink.messages);

      const messages = await db.query.MessageTable.findMany({
        orderBy(fields, operators) {
          return operators.asc(fields.createdAt);
        },
        where(fields, operators) {
          return operators.inArray(fields.id, publicLink.messages ?? []);
        },
      });

      if (!publicLink) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Public link not found",
        });
      }

      return {
        code: 200,
        result: messages,
      };
    }),
  getSuggestQuestion: publicProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(
      async (
        opts,
      ): Promise<ApiResult<{ job_id: string } | { suggestions: string[] }>> => {
        console.log("getSuggestQuestion: ", opts.input);

        const { auth, host, convo } = await getFetchOptionsFromConvo(
          opts.input.id,
        );

        const [isSample, dbName] = isSampleDataset(convo.dbUri);

        if (isSample) {
          const suggestions =
            DEFAULT_DATASET.find((d) => d.name === dbName)?.suggestions || [];

          return {
            code: 200,
            result: { suggestions },
          };
        }

        try {
          return await nodeFetch(`/v3/suggestQuestions`, {
            auth,
            host,
            method: "POST",
            headers: reuseHeader(opts.ctx.request),
            body: convo.dbUri
              ? {
                  database_uri: convo.dbUri,
                }
              : {
                  cluster_id: convo?.clusterId,
                  database: convo?.database,
                },
          });
        } catch (e) {
          console.log("getSuggestQuestion error: ", e);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              "Error when fetching suggest questions, please try again later",
            cause: e,
          });
        }
      },
    ),

  signin: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      }),
    )
    .mutation(async (opts) => {
      const { email, password } = opts.input;
      const existing = await db.query.UserTable.findFirst({
        where: (user, op) => op.eq(user.email, email),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const isValid = await verifyPassword(existing.password, password);
      console.log("isValid: ", isValid);
      if (!isValid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Email or password incorrect",
        });
      }

      const session = await lucia.createSession(existing.id, {});
      opts.ctx.response.setHeader(
        "Set-Cookie",
        lucia.createSessionCookie(session.id).serialize(),
      );

      return {
        email,
        id: existing.id,
      };
    }),
  signup: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6, "Password should be at least 6 characters"),
        isGuest: z.boolean().optional(),
      }),
    )
    .mutation(async (opts) => {
      const data = opts.input;
      const hashedPassword = await hashPassword(data.password);
      console.log("hashedPassword: ", hashedPassword);
      const existing = await db.query.UserTable.findFirst({
        where: (user, op) => op.eq(user.email, data.email),
      });

      console.log("existing: ", existing);

      const userId =
        existing?.id ?? opts.ctx.user?.id ?? generateIdFromEntropySize(10);

      console.log("userId: ", userId);

      try {
        if (existing) {
          const isValid = await verifyPassword(
            existing.password,
            data.password,
          );
          if (!isValid) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Email already exists",
            });
          }
        } else {
          const newUser = {
            id: userId,
            email: data.email,
            password: hashedPassword,
          };

          await db.insert(UserTable).values(newUser);
        }

        const session = await lucia.createSession(userId, {});
        opts.ctx.response.setHeader(
          "Set-Cookie",
          lucia.createSessionCookie(session.id).serialize(),
        );

        return {
          id: userId,
          email: data.email,
        };
      } catch (e) {
        console.log("Error signup: ", e);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error when creating new user",
          cause: e,
        });
      }
    }),
  signout: protectedProcedure.input(z.void()).mutation(async (opts) => {
    const session = opts.ctx.session;
    if (!session) {
      throw new TRPCError({
        code: "FORBIDDEN",
      });
    }
    await lucia.invalidateSession(session.id);
    opts.ctx.response.setHeader(
      "Set-Cookie",
      lucia.createBlankSessionCookie().serialize(),
    );
    return {
      message: "ok",
    };
  }),
  createConversation: protectedProcedure
    .input(
      z.object({
        name: z.string(),
      }),
    )
    .mutation(async (opts) => {
      const id = generateIdFromEntropySize(10);
      try {
        await db.insert(ConversationTable).values({
          id,
          name: opts.input.name,
          userId: opts.ctx.user.id,
        });

        const inserted = await db.query.ConversationTable.findFirst({
          where(fields, operators) {
            return operators.eq(fields.id, id);
          },
        });

        return {
          ...omit(inserted, "dbUri"),
        };
      } catch (e) {
        console.log("Error create conversation: ", e);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error when creating new conversation",
          cause: e,
        });
      }
    }),
  bindDatabase: protectedProcedure
    .input(
      z.union([
        z.object({
          id: z.string(),
          dataset: z.string(), // for sample db
        }),
        z.object({
          id: z.string(),
          uri: z.string(), // for user's own db
        }),
        z.object({
          id: z.string(), // for serverless db via oauth
        }),
      ]),
    )
    .mutation(async (opts) => {
      const dbUri = match(opts.input)
        .with({ dataset: P.string }, (input) => {
          const url = new URL(SampleDatasetConfig.dbUri);
          url.pathname = `/${input.dataset}`;
          return url.toString();
        })
        .with({ uri: P.string }, (val) => val.uri)
        .otherwise(() => "");

      console.log("bind db:", dbUri);

      const { auth, host, convo } = await getFetchOptionsFromConvo(
        opts.input.id,
        dbUri,
      );

      console.log("getFetchOptionsFromConvo:", auth, host);

      try {
        const data: ApiResult<{
          data_summary_id: number;
          job_id: string;
        }> = await nodeFetch("/v3/dataSummaries", {
          auth,
          host,
          method: "POST",
          headers: reuseHeader(opts.ctx.request),
          body: {
            ...(dbUri
              ? { database_uri: dbUri }
              : {
                  cluster_id: convo.clusterId,
                  database: convo.database,
                }),
            reuse: PrivateEnvVariables.ReuseDataSummary === "true",
            default: true,
          },
        });

        if (data.code !== 200) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: data.msg || "Errro calling /v3/dataSummaries",
            cause: data,
          });
        }

        const dbName = dbUri ? getDbName(dbUri) : convo?.database!;
        await db.transaction(async (tx) => {
          await tx
            .update(ConversationTable)
            .set({
              summaryId: data.result.data_summary_id,
              summaryJobId: data.result.job_id,
              dbUri,
            })
            .where(
              and(
                eq(ConversationTable.id, opts.input.id),
                eq(ConversationTable.userId, opts.ctx.user.id),
              ),
            );
          await tx
            .update(ConversationTable)
            .set({
              name: dbName,
            })
            .where(
              and(
                eq(ConversationTable.id, opts.input.id),
                eq(ConversationTable.name, DEFAULT_CONVO_NAME),
                eq(ConversationTable.userId, opts.ctx.user.id),
              ),
            );
        });

        return {
          dbSummaryId: data.result.data_summary_id,
          jobId: data.result.job_id,
          dbName,
        };
      } catch (e) {
        if (e instanceof TRPCError) {
          throw e;
        }
        if (e instanceof Error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: e.message,
            cause: e.cause,
          });
        }
      }
    }),
  refreshDataSummary: protectedProcedure
    .input(
      z.object({
        convoId: z.string(),
      }),
    )
    .mutation(async (opts) => {
      const { auth, host, convo } = await getFetchOptionsFromConvo(
        opts.input.convoId,
      );

      const dbUri = convo.dbUri;

      try {
        const data: ApiResult<{
          data_summary_id: number;
          job_id: string;
        }> = await nodeFetch("/v3/dataSummaries", {
          auth,
          host,
          method: "POST",
          headers: reuseHeader(opts.ctx.request),
          body: {
            ...(dbUri
              ? { database_uri: dbUri }
              : {
                  cluster_id: convo?.clusterId,
                  database: convo?.database,
                }),
            creator: "tiinsight",
            reuse: false,
            default: true,
          },
        });

        if (data.code !== 200) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: data.msg || "Errro calling /v3/dataSummaries",
            cause: data,
          });
        }

        await db
          .update(ConversationTable)
          .set({
            summaryId: data.result.data_summary_id,
            summaryJobId: data.result.job_id,
          })
          .where(
            and(
              eq(ConversationTable.id, opts.input.convoId),
              eq(ConversationTable.userId, opts.ctx.user.id),
            ),
          );

        return {
          dbSummaryId: data.result.data_summary_id,
          jobId: data.result.job_id,
        };
      } catch (e) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Errro creating dataSummaries",
          cause: e,
        });
      }
    }),
  listConversation: protectedProcedure
    .input(
      z.object({
        offset: z.number().optional(),
        limit: z.number().optional(),
      }),
    )
    .query(async (opts) => {
      try {
        const data = await db.query.ConversationTable.findMany({
          where(fields, operators) {
            return operators.eq(fields.userId, opts.ctx.user.id);
          },
        });

        return {
          data: data.map((i) => {
            const [isSample, dbName] = isSampleDataset(i.dbUri);
            const suggestions = isSample
              ? DEFAULT_DATASET.find((d) => d.name === dbName)?.suggestions ||
                []
              : i.suggestions ?? [];

            return {
              ...omit(i, "dbUri"),
              isSample,
              sampleDbName: dbName,
              suggestions,
            };
          }),
        };
      } catch (e) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error querying database",
          cause: e,
        });
      }
    }),
  deleteConversation: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async (opts) => {
      await db.transaction(async (tx) => {
        await tx
          .delete(MessageTable)
          .where(
            and(
              eq(MessageTable.conversationId, opts.input.id),
              eq(MessageTable.userId, opts.ctx.user.id),
            ),
          );
        await tx
          .delete(ConversationTable)
          .where(
            and(
              eq(ConversationTable.id, opts.input.id),
              eq(ConversationTable.userId, opts.ctx.user.id),
            ),
          );
      });
    }),
  renameConversation: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().max(50, "Name cannot be longer than 50 characters"),
      }),
    )
    .mutation(async (opts) => {
      await db
        .update(ConversationTable)
        .set({
          name: opts.input.name,
        })
        .where(
          and(
            eq(ConversationTable.id, opts.input.id),
            eq(ConversationTable.userId, opts.ctx.user.id),
          ),
        );
    }),
  insertMessage: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        convoId: z.string(),
        content: z.string(),
        isUser: z.boolean(),
        ancestors: z.array(z.string()).optional(),
        meta: z.any(),
      }),
    )
    .mutation(async (opts) => {
      const { id, convoId, content, isUser, meta, ancestors } = opts.input;
      await db.insert(MessageTable).values({
        id,
        content,
        userId: opts.ctx.user.id,
        conversationId: convoId,
        isByUser: isUser,
        bookmarked: false,
        metadata: {
          ...meta,
          ancestors,
        },
      });
    }),
  updateMessage: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        content: z.string(),
        bookmarked: z.boolean().optional(),
        ancestors: z.array(z.string()).optional(),
        meta: z.any(),
      }),
    )
    .mutation(async (opts) => {
      const { id, content, bookmarked, meta, ancestors } = opts.input;
      await db
        .update(MessageTable)
        .set({
          content,
          bookmarked,
          metadata: {
            ...meta,
            ancestors,
          },
        })
        .where(
          and(
            eq(MessageTable.id, id),
            eq(MessageTable.userId, opts.ctx.user.id),
          ),
        );
    }),
  saveBookmark: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        bookmarked: z.boolean(),
      }),
    )
    .mutation(async (opts) => {
      const { id, bookmarked } = opts.input;
      await db
        .update(MessageTable)
        .set({
          bookmarked,
        })
        .where(
          and(
            eq(MessageTable.id, id),
            eq(MessageTable.userId, opts.ctx.user.id),
          ),
        );
    }),
  listBookmarkedMessage: protectedProcedure
    .input(
      z.object({
        convoId: z.string(),
      }),
    )
    .query(async (opts) => {
      const data = await db
        .select()
        .from(MessageTable)
        .where(
          and(
            eq(MessageTable.conversationId, opts.input.convoId),
            eq(MessageTable.userId, opts.ctx.user.id),
            eq(MessageTable.bookmarked, true),
          ),
        )
        .orderBy(MessageTable.createdAt);

      return { data };
    }),
  listMessage: protectedProcedure
    .input(
      z.object({
        convoId: z.string(),
      }),
    )
    .query(async (opts) => {
      const data = await db
        .select()
        .from(MessageTable)
        .where(
          and(
            eq(MessageTable.conversationId, opts.input.convoId),
            eq(MessageTable.userId, opts.ctx.user.id),
          ),
        )
        .orderBy(MessageTable.createdAt);

      return { data };
    }),
  getDataSummary: protectedProcedure
    .input(
      z.object({
        convoId: z.string(),
      }),
    )
    .query(async (opts) => {
      const { auth, host, convo } = await getFetchOptionsFromConvo(
        opts.input.convoId,
      );

      try {
        const data: ApiResult<DatabaseUnderstandingV2> = await nodeFetch(
          `/v3/dataSummaries/${convo?.summaryId}`,
          {
            auth,
            host,
            method: "GET",
            headers: reuseHeader(opts.ctx.request),
          },
        );

        return data;
      } catch (e) {
        console.log("Error when fetching data summary: ", e);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error when fetching data summary, please retry",
          cause: e,
        });
      }
    }),
  saveSuggestion: protectedProcedure
    .input(
      z.object({
        convoId: z.string(),
        suggestions: z.array(z.string()),
      }),
    )
    .mutation(async (opts) => {
      await db
        .update(ConversationTable)
        .set({
          suggestions: opts.input.suggestions,
        })
        .where(
          and(
            eq(ConversationTable.id, opts.input.convoId),
            eq(ConversationTable.userId, opts.ctx.user.id),
          ),
        );
    }),
  getTidbCloudOauthSigninUrl: publicProcedure
    .input(
      z.object({
        redirectUrl: z.string(),
      }),
    )
    .query(async (opts) => {
      const state = generateState();
      const oauth2Client = createOAuth2Client(opts.input.redirectUrl);

      const url = await oauth2Client.createAuthorizationURL({
        state,
        scopes: ["org:owner", "project:owner"],
      });

      opts.ctx.response.setHeader(
        "Set-Cookie",
        serializeCookie("github_oauth_state", state, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 10, // 10 minutes
          path: "/",
        }),
      );

      return {
        url,
      };
    }),
  tidbcloudOauthCallback: protectedProcedure
    .input(
      z.object({
        state: z.string(),
        code: z.string(),
        redirectUri: z.string(),
      }),
    )
    .mutation(async (opts) => {
      const cookies = parseCookies(opts.ctx.request.headers.cookie ?? "");
      const stateCookie = cookies.get("github_oauth_state") ?? null;

      const { code, state, redirectUri } = opts.input;

      // verify state
      if (!state || !stateCookie || !code || stateCookie !== state) {
        throw new TRPCError({
          code: "BAD_REQUEST",
        });
      }

      const data = await getAccessToken(code, redirectUri);
      const { access_token: accessToken, refresh_token: refreshToken } = data;
      console.log("token exchanged: ", data);

      const tidbcloudUserInfo = await getUserInfo(data.access_token);
      console.log("tidbcloudUserInfo: ", tidbcloudUserInfo);

      // check is this email already signed up
      let existingUser = await db.query.UserTable.findFirst({
        where(fields, operators) {
          return operators.eq(fields.email, tidbcloudUserInfo.email);
        },
      });

      if (existingUser) {
        // if this guest user have conversations
        // then assign them to this signed up tidb user
        // so he won't lost any data
        const userId = existingUser.id;
        await db.transaction(async (tx) => {
          await tx
            .update(MessageTable)
            .set({ userId })
            .where(eq(MessageTable.userId, opts.ctx.user.id));
          await tx
            .update(ConversationTable)
            .set({ userId })
            .where(
              and(
                eq(ConversationTable.userId, opts.ctx.user.id),
                isNotNull(ConversationTable.sessionId),
                isNotNull(ConversationTable.summaryId),
              ),
            );
        });
      }

      const userId =
        existingUser?.id ?? opts.ctx.user.id ?? generateIdFromEntropySize(10);

      if (!existingUser) {
        // if email is not signed up, then sign up to guest account and update email later
        existingUser = await db.query.UserTable.findFirst({
          where(fields, operators) {
            return operators.eq(fields.id, userId);
          },
        });
      }

      console.log("existingUser: ", existingUser);

      if (existingUser) {
        await db
          .update(UserTable)
          .set({
            email: tidbcloudUserInfo.email,
            name: tidbcloudUserInfo.username,
          })
          .where(eq(UserTable.id, userId));
      } else {
        await db.insert(UserTable).values({
          id: userId,
          email: tidbcloudUserInfo.email,
          name: tidbcloudUserInfo.username,
          password: userId,
        });
      }

      const session = await lucia.createSession(userId, {
        accessToken,
        refreshToken,
      });
      await db
        .update(UserSessionTable)
        .set({
          accessToken: await encryptToken(accessToken),
          refreshToken: await encryptToken(refreshToken),
        })
        .where(eq(UserSessionTable.id, session.id));
      opts.ctx.response.setHeader(
        "Set-Cookie",
        lucia.createSessionCookie(session.id).serialize(),
      );

      return {
        id: userId,
        email: tidbcloudUserInfo.email,
      };
    }),
  listTidbCloudClusters: protectedProcedure
    .input(z.void())
    .query(async (opts) => {
      const accessToken = opts.ctx.session?.accessToken;
      const refreshToken = opts.ctx.session?.refreshToken;

      if (!accessToken || !refreshToken) {
        throw new TRPCError({
          code: "FORBIDDEN",
        });
      }

      const data = await getUserClusters(accessToken);
      console.log("clusterData:", data);
      return data;
    }),
  showDatabasesOfCluster: protectedProcedure
    .input(
      z.object({
        clusterId: z.string(),
        projectId: z.string(),
        region: z.string(),
      }),
    )
    .query(async (opts) => {
      const { clusterId, projectId, region } = opts.input;
      console.log("showDatabasesOfCluster: ", opts.input);
      const accessToken = opts.ctx.session?.accessToken;
      const userId = opts.ctx.session?.userId!;

      const existing = await db.query.ServerlessClusterTable.findFirst({
        where(fields, operators) {
          return operators.and(
            operators.eq(fields.clusterId, clusterId),
            operators.eq(fields.projectId, projectId),
            operators.eq(fields.userId, userId),
          );
        },
      });

      if (existing) {
        console.log("existing cluster:", existing);
        if (existing.region !== region) {
          await db
            .update(ServerlessClusterTable)
            .set({ region })
            .where(eq(ServerlessClusterTable.id, existing.id));
        }

        const dbs = await showDatabases({
          dataAppId: existing.dataAppId,
          key: await decryptToken(existing.dataAppKey),
          clusterId,
          region,
        });

        console.log("dbs:", dbs);
        return dbs;
      }

      const data = await getUserDataApps({
        accessToken: accessToken!,
        clusterId,
        projectId,
      });

      console.log("data apps:", data);

      const [chat2queryApp, dataApp] = await Promise.all([
        createChat2QueryAppAndKey({
          dataApps: data.dataApps,
          accessToken: accessToken!,
          clusterId,
          projectId,
        }),
        createDataAppAndKey({
          dataApps: data.dataApps,
          accessToken: accessToken!,
          clusterId,
          projectId,
        }),
      ]);

      console.log("chat2queryApp:", chat2queryApp);
      console.log("dataApp:", dataApp);

      await db.insert(ServerlessClusterTable).values({
        id: generateIdFromEntropySize(10),
        userId: userId,
        region,
        projectId,
        clusterId,
        dataAppId: dataApp.id,
        dataAppKey: await encryptToken(dataApp.key),
        chat2queryAppId: chat2queryApp.id,
        chat2queryKey: await encryptToken(chat2queryApp.key),
      });

      const dbs = await showDatabases({
        dataAppId: dataApp.id,
        key: dataApp.key,
        clusterId,
        region,
      });
      console.log("dbs:", dbs);

      return dbs;
    }),
  connectToServerlessCluster: protectedProcedure
    .input(
      z.object({
        clusterId: z.string(),
        projectId: z.string(),
        database: z.string(),
        convoId: z.string(),
      }),
    )
    .mutation(async (opts) => {
      const { clusterId, database, convoId } = opts.input;
      console.log("connectToServerlessCluster: ", opts.input);
      const userId = opts.ctx.session?.userId!;
      await db
        .update(ConversationTable)
        .set({
          database,
          clusterId,
        })
        .where(
          and(
            eq(ConversationTable.userId, userId),
            eq(ConversationTable.id, convoId),
          ),
        );

      return { message: "ok" };
    }),
  rerunSQL: protectedProcedure
    .input(
      z.object({
        convoId: z.string(),
        messageId: z.string(),
      }),
    )
    .query(async (opts) => {
      const { convoId, messageId } = opts.input;
      const existing = await db.query.ConversationTable.findFirst({
        where(fields, operators) {
          return operators.eq(fields.id, convoId);
        },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversation not found",
        });
      }

      if (!existing.database || !existing.clusterId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Database or cluster not found",
        });
      }

      const message = await db.query.MessageTable.findFirst({
        where(fields, operators) {
          return operators.eq(fields.id, messageId);
        },
      });

      if (!message) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Message not found",
        });
      }

      const meta = message.metadata;
      if (!isResolvedAnswer(meta) || !meta.sql) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Message is not a resolved answer",
        });
      }

      const cluster = await db.query.ServerlessClusterTable.findFirst({
        where(fields, operators) {
          return operators.eq(fields.clusterId, existing.clusterId!);
        },
      });

      if (!cluster) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversation not connected to a cluster",
        });
      }

      const result = await runSql({
        dataAppId: cluster.dataAppId,
        key: await decryptToken(cluster.dataAppKey),
        clusterId: cluster.clusterId,
        database: existing.database,
        sql: meta.sql,
        region: cluster.region,
      });

      return result;
    }),
  listModel: publicProcedure.input(z.void()).query(async (opts) => {
    const defaultModel = ["gpt-4o-mini"];
    if (opts.ctx.user && !isGuestEmail(opts.ctx.user.email)) {
      return [...defaultModel, "gpt-4o"];
    }
    return defaultModel;
  }),
});

function isGuestEmail(email: string) {
  return email.startsWith("guest_") && email.endsWith("@tiinsight.chat");
}

// export only the type definition of the API
// None of the actual implementation is exposed to the client
export type AppRouter = typeof appRouter;

// export API handler
export default trpcNext.createNextApiHandler({
  router: appRouter,
  createContext,

  onError(opts) {
    const { error } = opts;
    console.error("Error:", error.message);
    Sentry.captureException(error);
  },
});
