import { httpBatchLink } from "@trpc/client";
import { createTRPCNext } from "@trpc/next";

import type { AppRouter } from "~/pages/api/gateway/[trpc]";
import { getBaseUrl } from "./trpc";
import { getHeaders } from "./trpc.header";

export const trpcNextClient = createTRPCNext<AppRouter>({
  config() {
    return {
      links: [
        httpBatchLink({
          url: getBaseUrl() + "/api/gateway",
          headers: getHeaders,
        }),
      ],
    };
  },
  ssr: false,
});
