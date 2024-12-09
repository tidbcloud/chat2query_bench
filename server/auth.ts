import type { IncomingMessage, ServerResponse } from "http";
import { Lucia } from "lucia";
import type { Session, User } from "lucia";

import { decryptToken } from "~/utils/encrypt";
import { adapter } from "./db";
import type {
  Session as DatabaseSessionAttributes,
  User as DatabaseUserAttributes,
} from "./schema";

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: process.env.NODE_ENV === "production",
    },
  },
  getUserAttributes(databaseUserAttributes) {
    return {
      email: databaseUserAttributes.email,
      createdAt: databaseUserAttributes.createdAt,
    };
  },
  getSessionAttributes(databaseSessionAttributes) {
    const { accessToken, refreshToken } = databaseSessionAttributes;
    return {
      accessToken,
      refreshToken,
    };
  },
});

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: DatabaseUserAttributes;
    DatabaseSessionAttributes: Pick<
      Partial<DatabaseSessionAttributes>,
      "accessToken" | "refreshToken"
    >;
  }
}

export async function validateRequest(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<{ user: User; session: Session } | { user: null; session: null }> {
  const sessionId = lucia.readSessionCookie(req.headers.cookie ?? "");
  if (!sessionId) {
    return {
      user: null,
      session: null,
    };
  }
  const result = await lucia.validateSession(sessionId);
  if (result.session?.fresh) {
    res.setHeader(
      "Set-Cookie",
      lucia.createSessionCookie(result.session.id).serialize(),
    );
  }

  // decrypt token
  if (result.session?.accessToken && result.session?.refreshToken) {
    const { accessToken, refreshToken } = result.session;
    const at = accessToken
      ? accessToken.startsWith("ticloud_oa")
        ? accessToken
        : await decryptToken(accessToken)
      : accessToken;

    const rt = refreshToken
      ? refreshToken.startsWith("ticloud_or")
        ? refreshToken
        : await decryptToken(refreshToken)
      : refreshToken;

    result.session.accessToken = at;
    result.session.refreshToken = rt;
  }

  if (!result.session) {
    res.setHeader("Set-Cookie", lucia.createBlankSessionCookie().serialize());
  }
  return result;
}
