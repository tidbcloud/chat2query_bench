import * as trpcNext from "@trpc/server/adapters/next";
import { validateRequest } from "./auth";

export async function createContext({
  req,
  res,
}: trpcNext.CreateNextContextOptions) {
  const { user, session } = await validateRequest(req, res);

  return {
    user,
    session,
    request: req,
    response: res,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
