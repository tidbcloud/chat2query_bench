import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";

import type { AppRouter } from "~/pages/api/gateway/[trpc]";

import { getBaseUrl } from "./trpc";
import { getHeaders } from "./trpc.header";

export const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: getBaseUrl() + "/api/gateway",
      headers: getHeaders,
    }),
  ],
});
