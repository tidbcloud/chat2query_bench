import { DrizzleMySQLAdapter } from "@lucia-auth/adapter-drizzle";
import { connect } from "@tidbcloud/serverless";
import { drizzle } from "drizzle-orm/tidb-serverless";

import * as schema from "./schema";

const client = connect({ url: process.env.TIINSIGHT_DB_URI });

export const db = drizzle(client, { schema });

export const adapter = new DrizzleMySQLAdapter(
  db,
  schema.UserSessionTable,
  schema.UserTable,
);
