import { P, isMatching } from "ts-pattern";
import { Primitive } from "zod";

export type ApiResult<T = any> = {
  code: number;
  msg?: string;
  result: T;
};

/**
 * The meta data of the session, represented by a JSON object
 */
export type SessionContextsSessionsItemMeta = {
  /** Creation time of the session */
  created_at?: number;
  /** Name of the session */
  name?: string;
  /** Update time of the session */
  updated_at?: number;
};

export type SessionContextsSessionsItem = {
  /** The meta data of the session, represented by a JSON object */
  meta?: SessionContextsSessionsItemMeta;
  /** ID of the session */
  session_id?: number;
};

export interface TableColumn {
  name: string;
  type: string;
  default: string | null;
  comment: string | null;
  nullable: boolean;
  description: string;
  /**
   * json string of ColumnStats
   */
  statistics: string;
  sample_data: string;
  autoincrement?: boolean;
}

export interface ColumnStats {
  count: number;
  unique: number;
  freq: number;
  top?: number;
  mean?: number;
  std?: number;
  min?: number;
  "25%"?: number;
  "50%"?: number;
  "75%"?: number;
  max?: number;
}

export interface TableColumnsDetail {
  table_name: string;
  description: string;
  columns: Record<string, TableColumn>;
  type: string;
  key_attributes: string[];
  entity: string;
  status: string;
  primary_key: string;
}

export type DatabaseSchemaMap = Record<string, TableColumnsDetail>;
export type TableRelationshipMap = Record<string, Relationship[]>;

export interface Relationship {
  referencing_table: string;
  referenced_table: string;
  relationship: "1:N" | "N:1";
  foreign_key_column: string;
  primary_key_column: string;
}

export type TablesSampleDataMap = Record<
  string,
  { table_name: string; sample_data_str: string }
>;

export type EntityMap = Record<string, Entity>;

export type Entity = {
  name: string;
  attributes: string[];
  involved_tables: string[];
  summary: string;
};

export interface DatabaseUnderstandingV2 {
  cluster_id: string;
  data_summary_id: string;
  database: string;
  default: boolean;
  description: {
    system: string;
    user: string;
  };
  keywords: string[];
  relationships: Record<
    string,
    Array<{
      referenced_table: string;
      referenced_table_column: string;
      referencing_table: string;
      referencing_table_column: string;
    }>
  >;
  status: "inited" | "done" | string;
  summary: string;
  tables: Record<
    string,
    {
      columns: Record<
        string,
        {
          name: string;
          description: string;
        }
      >;
      description: string;
      name: string;
    }
  >;
}

export const isDatabaseUnderstandingV2 = (
  val: unknown,
): val is DatabaseUnderstandingV2 => {
  return (
    typeof val === "object" &&
    val !== null &&
    "data_summary_id" in val &&
    "description" in val &&
    "keywords" in val &&
    "relationships" in val &&
    "tables" in val
  );
};

export interface DatabaseUnderstanding {
  app_id: number;
  db_name?: string;
  status: "inited" | "done" | string;
  db_schema: DatabaseSchemaMap;
  tables_sample_data: TablesSampleDataMap;
  table_relationship: TableRelationshipMap;
  entity: EntityMap;
  statistics: {
    columns_count: number;
    tables_count: number;
  };
  summary: string;
  short_summary: string;
  summary_keywords: string[];
}

export const isDatabaseUnderstanding = (
  val: unknown,
): val is DatabaseUnderstanding => {
  return (
    typeof val === "object" &&
    val !== null &&
    "db_schema" in val &&
    "tables_sample_data" in val &&
    "table_relationship" in val
  );
};

export interface ChartOptions {
  chart_name: "BarChart" | "Table";
  title: string;
  option: {
    x: string;
    y: string;
    pivot_column: string;
  };
}

export interface TaskTreeNode {
  breakdown_type: "Resolve" | "Breakdown";
  chartOptions: ChartOptions;
  clarified_task: string;
  columns: { col: string }[];
  description: string;
  level: number;
  parent_task: string;
  parent_task_id: string;
  reason: string;
  recommendations: Array<{ method_name: string; explanation: string }>;
  rows: any[][];
  sql: string;
  sql_error: string;
  task: string;
  task_id: string;
  possibleExplanations?: string[];
  assumptions?: {
    concept: string;
    explanation: string;
    related_columns: string[];
  }[];
  sub_task_list?: string[];

  question_id: string;
  session_context_id: number;
}

export interface QuestionBreakdown {
  question_id: string;
  raw_question: string;
  task_tree: Record<string, TaskTreeNode>;
}

interface Assumption {
  concept: string;
  explanation: string;
}

export interface Chat2DataResolvedAnswer {
  assumptions: Assumption[];
  chart_options: ChartOptions | null;
  clarified_task: string;
  data: {
    columns: { col: string }[];
    rows: Primitive[][];
  };
  description: string;
  sql: string;
  sql_error: string | null;
  status: string;
  task_id: string;
  type: "data_retrieval";
}

export const isResolvedAnswer = (
  val: unknown,
): val is Chat2DataResolvedAnswer => {
  return isMatching(
    {
      type: "data_retrieval",
    },
    val,
  );
};

export interface Chat2DataBreakdownAnswer {
  assumptions: Assumption[];
  clarified_task: string;
  description: string;
  status: string;
  sub_tasks: Chat2DataResolvedAnswer[];
  task_id: string;
  type: "breakdown";
}

export const isBreakdownAnswer = (
  val: unknown,
): val is Chat2DataBreakdownAnswer => {
  return isMatching(
    {
      type: "breakdown",
    },
    val,
  );
};

export const isQuestionBreakdown = (val: unknown): val is QuestionBreakdown =>
  isMatching(
    {
      question_id: P.string,
      raw_question: P.string,
    },
    val,
  );

export interface UnresolvedQuestionBreakdown
  extends Pick<
    TaskTreeNode,
    | "assumptions"
    | "clarified_task"
    | "description"
    | "level"
    | "parent_task"
    | "parent_task_id"
    | "possibleExplanations"
    | "reason"
    | "sub_task_list"
    | "task"
    | "task_id"
  > {
  breakdown_type: "Breakdown";
}

export const isUnresolvedQuestionBreakdown = (
  val: unknown,
): val is UnresolvedQuestionBreakdown => {
  return isMatching({ breakdown_type: "Breakdown" }, val);
};

export interface ResolvedQuestionBreakdown extends TaskTreeNode {
  breakdown_type: "Resolve";
}

export const isResolvedQuestionBreakdown = (
  val: unknown,
): val is ResolvedQuestionBreakdown =>
  isMatching(
    {
      breakdown_type: "Resolve",
      task_id: P.string,
      parent_task_id: P.string,
    },
    val,
  );

export type QuestionSuggestions = string[];

export const isQuestionSuggestions = (
  val: unknown,
): val is QuestionSuggestions => {
  return isMatching(P.array(P.string), val);
};

export interface TiDBCloudOAuthExchangeTokenResult {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}

export interface TidbCloudListClusterResponse {
  clusters: Cluster[];
  nextPageToken: string;
  totalSize: number;
}

interface Project {
  id: string;
  name: string;
  org_id: string;
  create_timestamp: string;
  user_count: number;
  cluster_count: number;
  aws_cmek_enabled: boolean;
}

export interface TidbCloudListProjectResponse {
  projects: Project[];
  nextPageToken: string;
}

export interface Cluster {
  name: string;
  clusterId: string;
  displayName: string;
  region: Region;
  version: string;
  createdBy: string;
  userPrefix: string;
  endpoints: Endpoints;
  state: string;
  encryptionConfig: EncryptionConfig;
  labels: Labels;
  annotations: Annotations;
  createTime: Date;
  updateTime: Date;
}

export interface Annotations {
  "tidb.cloud/available-features": string;
  "tidb.cloud/has-set-password": string;
}

export interface EncryptionConfig {
  enhancedEncryptionEnabled: boolean;
}

export interface Endpoints {
  public: Public;
  private: Private;
}

export interface Private {
  host: string;
  port: number;
  aws: Aws;
}

export interface Aws {
  serviceName: string;
  availabilityZone: string[];
}

export interface Public {
  host: string;
  port: number;
  disabled: boolean;
}

export interface Labels {
  "tidb.cloud/organization": string;
  "tidb.cloud/project": string;
}

export interface Region {
  name: string;
  regionId: string;
  cloudProvider: string;
  displayName: string;
  provider: string;
}

export interface DataApp {
  dataAppId: string;
  name: string;
  version: string;
  projectId: string;
  clusterIds: string[];
  appType: "DATAAPP" | "CHAT2QUERY";
  displayName: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface DataAppsResponse {
  dataApps: DataApp[];
  nextPageToken: string;
}

interface EndpointParam {
  name: string;
  type: string;
  itemType: string;
  required: boolean;
  defaultValue: string;
  description: string;
  enum: string;
}

interface EndpointSettings {
  timeout: number;
  rowLimit: number;
  paginationEnabled: boolean;
  cacheEnabled: boolean;
  cacheTtl: number;
}

interface Endpoint {
  name: string;
  status: string;
  displayName: string;
  description: string;
  path: string;
  method: string;
  clusterId: string;
  params: EndpointParam[];
  settings: EndpointSettings;
  tag: string;
  batchOperation: boolean;
  sqlTemplate: string;
  type: string;
  returnType: string;
  createdAt: string;
  updatedAt: string;
}

export interface EndpointsResponse {
  endpoints: Endpoint[];
  nextPageToken: string;
}

interface ApiKeyExpireSetting {
  expireOption: string;
  apiKeyTtl: number;
}

export interface DataServiceApiResult {
  apiKeyId: string;
  name: string;
  publicKey: string;
  privateKey: string;
  description: string;
  role: string;
  rateLimitRpm: number;
  expireState: string;
  expireTime: string | null;
  apiKeyExpireSetting: ApiKeyExpireSetting | null;
}
