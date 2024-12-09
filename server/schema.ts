import {
  boolean,
  int,
  json,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

const withTimestamp = () => {
  return {
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  };
};

export const UserTable = mysqlTable("users", {
  id: varchar("id", { length: 255 }).notNull().primaryKey(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  ...withTimestamp(),
});

export const UserSessionTable = mysqlTable("user_sessions", {
  id: varchar("id", { length: 255 }).notNull().primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => UserTable.id),
  accessToken: varchar("tidbcloud_access_token", { length: 500 }),
  refreshToken: varchar("tidbcloud_refresh_token", { length: 500 }),
  ...withTimestamp(),
});

export const ConversationTable = mysqlTable("conversations", {
  id: varchar("id", { length: 255 }).notNull().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => UserTable.id),
  summaryId: int("db_summary_id"),
  summaryJobId: varchar("db_summary_job_id", { length: 100 }),
  sessionId: int("session_id"),
  dbUri: varchar("db_uri", { length: 500 }),
  database: varchar("database", { length: 255 }),
  clusterId: varchar("cluster_id", { length: 255 }),
  suggestions: json("suggestions").$type<string[]>(),
  ...withTimestamp(),
});

export const MessageTable = mysqlTable("messages", {
  id: varchar("id", { length: 255 }).notNull().primaryKey(),
  content: text("content"),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => UserTable.id),
  conversationId: varchar("conversation_id", { length: 255 })
    .notNull()
    .references(() => ConversationTable.id),
  isByUser: boolean("is_by_user").notNull(),
  bookmarked: boolean("bookmarked").notNull(),
  metadata: json("metadata"),
  ...withTimestamp(),
});

export const ServerlessClusterTable = mysqlTable("tidb_serverless_cluster", {
  id: varchar("id", { length: 255 }).notNull().primaryKey(),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => UserTable.id),
  region: varchar("region", { length: 255 }).notNull(),
  projectId: varchar("project_id", { length: 255 }).notNull(),
  clusterId: varchar("cluster_id", { length: 255 }).notNull(),
  chat2queryAppId: varchar("chat2query_app_id", { length: 255 }).notNull(),
  chat2queryKey: varchar("chat2query_key", { length: 500 }).notNull(),
  dataAppId: varchar("data_app_id", { length: 255 }).notNull(),
  dataAppKey: varchar("data_app_key", { length: 500 }).notNull(),
  ...withTimestamp(),
});

export const PublicLinkTable = mysqlTable("public_links", {
  id: varchar("id", { length: 255 }).notNull().primaryKey(),
  messages: json("messages").$type<string[]>(),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => UserTable.id),
  ...withTimestamp(),
});

export type User = typeof UserTable.$inferSelect;
export type Session = typeof UserSessionTable.$inferSelect;
export type Conversation = typeof ConversationTable.$inferSelect;
export type Message = typeof MessageTable.$inferSelect;
export type ServerlessCluster = typeof ServerlessClusterTable.$inferSelect;
