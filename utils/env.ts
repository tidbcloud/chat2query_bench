export const PrivateEnvVariables = {
  TiInsightDatabase: process.env.TIINSIGHT_DB_URI!,
  OpenApiDoc: `${process.env.DOC_HOST}/eda/apidocs/swagger.json`,
  ReuseDataSummary: process.env.REUSE_DATA_SUMMARY,
  NodeEnv: process.env.NODE_ENV,
  VercelEnv: process.env.VERCEL_ENV,
  MasterKeyV0: process.env.MASTER_KEY_V0!,
  TidbCloudDataAppEndpointHost: process.env.TIDBCLOUD_DATA_APP_ENDPOINT_HOST!,
  TidbCloudOauthClientId: process.env.TIDBCLOUD_OAUTH_CLIENT_ID!,
  TidbCloudOauthClientSecret: process.env.TIDBCLOUD_OAUTH_CLIENT_SECRET!,
  TidbCloudOauthHost: process.env.TIDBCLOUD_OAUTH_HOST!,
  TidbCloudOpenApiHost: process.env.TIDBCLOUD_OPEN_API_HOST!,
};

export const SampleDatasetConfig = {
  dataAppHost: `${process.env.SAMPLE_DB_DATA_APP_BASE_URL}/${process.env.SAMPLE_DB_DATA_APP_ID}/endpoint`,
  auth: `${process.env.SAMPLE_DB_PUBLIC_KEY}:${process.env.SAMPLE_DB_PRIVATE_KEY}`,
  dbUri: process.env.SAMPLE_DB_URI!,
};
