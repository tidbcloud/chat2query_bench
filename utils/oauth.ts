import { OAuth2Client } from "oslo/oauth2";
import pRetry from "p-retry";
import wretch from "wretch";
import {
  DataApp,
  DataAppsResponse,
  DataServiceApiResult,
  EndpointsResponse,
  TiDBCloudOAuthExchangeTokenResult,
  TidbCloudListClusterResponse,
  TidbCloudListProjectResponse,
} from "~/server/api";
import { PrivateEnvVariables } from "~/utils/env";
import { nodeFetch } from "./fetch";

export const CLIENT_ID = PrivateEnvVariables.TidbCloudOauthClientId;
export const CLIENT_SECRET = PrivateEnvVariables.TidbCloudOauthClientSecret;

// https://[dev/staging].tidbcloud.com/oauth/authorize
const authorizeEndpoint = `${PrivateEnvVariables.TidbCloudOauthHost}/oauth/authorize`;

// https://oauth.[dev/staging].tidbcloud.com/
export const tidbCloudOauthEndpoint = `${PrivateEnvVariables.TidbCloudOauthHost?.replace(
  "https://",
  "https://oauth.",
)}`;

// https://iam.[dev/staging].tidbapi.com/v1beta1
export const tidbCloudUserOpenAPIHost = `${PrivateEnvVariables.TidbCloudOpenApiHost?.replace(
  "https://",
  "https://iam.",
)}`;

// https://serverless.[dev/staging].tidbapi.com/v1beta1
export const tidbCloudServerlessOpenAPIHost = `${PrivateEnvVariables.TidbCloudOpenApiHost?.replace(
  "https://",
  "https://serverless.",
)}`;

// https://dataservice.[dev/staging].tidbapi.com/v1beta1
export const tidbCloudDataServiceOpenAPIHost = `${PrivateEnvVariables.TidbCloudOpenApiHost?.replace(
  "https://",
  "https://dataservice.",
)}`;

export const dataAppEndpointHost =
  PrivateEnvVariables.TidbCloudDataAppEndpointHost;

export const createOAuth2Client = (redirectURI?: string) => {
  return new OAuth2Client(
    CLIENT_ID,
    authorizeEndpoint,
    `${tidbCloudOauthEndpoint}/v1/token`,
    {
      redirectURI,
    },
  );
};

export function getAccessToken(code: string, redirectUri: string) {
  return wretch(`${tidbCloudOauthEndpoint}/v1/token`)
    .post({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    })
    .json<TiDBCloudOAuthExchangeTokenResult>();
}

export function getUserInfo(accessToken: string) {
  return wretch(`${tidbCloudOauthEndpoint}/v1/userinfo`)
    .headers({
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    })
    .get()
    .json<{
      first_name: string;
      last_name: string;
      email: string;
      username: string;
    }>();
}

export async function getUserClusters(accessToken: string) {
  const projects = await wretch(`${tidbCloudUserOpenAPIHost}/projects`)
    .headers({
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    })
    .get()
    .json<TidbCloudListProjectResponse>();

  console.log("projects:", projects);

  const data = await wretch(`${tidbCloudServerlessOpenAPIHost}/clusters`)
    .headers({
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    })
    .get()
    .json<TidbCloudListClusterResponse>();

  return {
    ...data,
    clusters: data.clusters
      .map((i) => {
        const project = projects.projects.find(
          (j) => j.id === i.labels["tidb.cloud/project"],
        );
        const projectName = project?.name;
        return {
          ...i,
          displayName: projectName ? `${projectName}/${i.displayName}` : i.name,
        };
      })
      .sort((a, b) => a.displayName.localeCompare(b.displayName)),
  };
}

export function getUserDataApps({
  accessToken,
  projectId,
  clusterId,
}: {
  accessToken: string;
  projectId: string;
  clusterId: string;
}) {
  return wretch(
    `${tidbCloudDataServiceOpenAPIHost}/dataApps?projectId=${projectId}&clusterId=${clusterId}`,
  )
    .headers({
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    })
    .get()
    .json<DataAppsResponse>();
}

export function createUserDataApp({
  accessToken,
  projectId,
  clusterId,
  type,
  name,
}: {
  accessToken: string;
  projectId: string;
  clusterId: string;
  type: DataApp["appType"];
  name: string;
}) {
  return wretch(`${tidbCloudDataServiceOpenAPIHost}/dataApps`)
    .headers({
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    })
    .post({
      projectId,
      clusterIds: [clusterId],
      appType: type,
      version: "1.0.0",
      displayName: name,
      description: "Created by TiInsight, please don't edit.",
    })
    .json<DataApp>();
}

export function addClusterToDataApp({
  accessToken,
  id,
  clusterId,
}: {
  id: string;
  clusterId: string;
  accessToken: string;
}) {
  return wretch(`${tidbCloudDataServiceOpenAPIHost}/dataApps/${id}/dataSources`)
    .headers({
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    })
    .post({ clusterId })
    .json();
}

export function getSystemEndpoint({
  id,
  accessToken,
}: {
  id: string;
  accessToken: string;
}) {
  return wretch(
    `${tidbCloudDataServiceOpenAPIHost}/dataApps/${id}/systemEndpointConfig`,
  )
    .headers({
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    })
    .get()
    .json<{
      name: string;
      items: { type: string; key: string; enabled: boolean }[];
    }>();
}

export function enableSystemEndpoint({
  id,
  accessToken,
}: {
  id: string;
  accessToken: string;
}) {
  return wretch(
    `${tidbCloudDataServiceOpenAPIHost}/dataApps/${id}/systemEndpointConfig`,
  )
    .headers({
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    })
    .patch({
      items: [
        {
          type: "system-data",
          key: "POST:/system/query",
          enabled: true,
        },
      ],
    })
    .json();
}

export function listEndpoints({
  id,
  accessToken,
}: {
  id: string;
  accessToken: string;
}) {
  return wretch(`${tidbCloudDataServiceOpenAPIHost}/dataApps/${id}/endpoints`)
    .headers({
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    })
    .get()
    .json<EndpointsResponse>();
}

interface Column {
  col: string;
  data_type: string;
  nullable: boolean;
}

interface Row {
  [key: string]: string;
}

interface Result {
  code: number;
  message: string;
  start_ms: number;
  end_ms: number;
  latency: string;
  row_count: number;
  row_affect: number;
  limit: number;
}

interface SqlEndpointData {
  columns: Column[];
  rows: Row[];
  result: Result;
}

interface SqlEndpointResponse {
  type: string;
  data: SqlEndpointData;
}

const EXCLUDED_DB = new Set([
  "INFORMATION_SCHEMA",
  "PERFORMANCE_SCHEMA",
  "mysql",
]);

export async function showDatabases({
  dataAppId,
  key,
  clusterId,
  region,
}: {
  dataAppId: string;
  key: string;
  clusterId: string;
  region: string;
}): Promise<string[]> {
  const run = async () => {
    const result: SqlEndpointResponse = await nodeFetch(
      `${dataAppEndpointHost.replace(
        "us-west-2",
        region,
      )}/${dataAppId}/endpoint/system/query`,
      {
        auth: key as any,
        method: "POST",
        body: {
          cluster_id: clusterId,
          database: "mysql",
          sql: "SHOW DATABASES",
        },
      },
    );

    console.log("show database result:", result);

    return result.data.rows
      .map((row) => row.Database)
      .filter((i) => !EXCLUDED_DB.has(i));
  };

  return await pRetry(run, { retries: 3 });
}

export async function runSql({
  dataAppId,
  key,
  clusterId,
  database,
  sql,
  region,
}: {
  dataAppId: string;
  key: string;
  clusterId: string;
  database: string;
  sql: string;
  region: string;
}) {
  const result: SqlEndpointResponse = await nodeFetch(
    `${dataAppEndpointHost.replace(
      "us-west-2",
      region,
    )}/${dataAppId}/endpoint/system/query`,
    {
      auth: key as any,
      method: "POST",
      body: {
        cluster_id: clusterId,
        database,
        sql,
      },
    },
  );

  return result;
}

export function createApiKey({
  id,
  accessToken,
  role,
}: {
  id: string;
  accessToken: string;
  role: "CHAT2QUERY_ADMIN" | "READ_AND_WRITE";
}) {
  return wretch(`${tidbCloudDataServiceOpenAPIHost}/dataApps/${id}/apiKeys`)
    .headers({
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    })
    .post({
      description: "Created by TiInsight, please don't edit.",
      role,
      rateLimitRpm: 100,
      apiKeyExpireSetting: {
        expireOption: "EXPIRE_OPTION_NEVER_EXPIRE",
      },
    })
    .json<DataServiceApiResult>();
}

export async function createChat2QueryAppAndKey({
  accessToken,
  clusterId,
  projectId,
  dataApps,
}: {
  accessToken: string;
  projectId: string;
  clusterId: string;
  dataApps: DataApp[];
}) {
  let chat2queryApp = dataApps.find((i) => i.appType === "CHAT2QUERY");
  if (!chat2queryApp) {
    chat2queryApp = await createUserDataApp({
      accessToken: accessToken!,
      clusterId,
      projectId,
      type: "CHAT2QUERY",
      name: "TiInsight-Chat2Query",
    });
  } else if (!chat2queryApp.clusterIds.includes(clusterId)) {
    await addClusterToDataApp({
      accessToken: accessToken!,
      clusterId,
      id: chat2queryApp.dataAppId,
    });
  }

  const key = await createApiKey({
    id: chat2queryApp.dataAppId,
    accessToken: accessToken!,
    role: "CHAT2QUERY_ADMIN",
  });
  const chat2queryKey = `${key.publicKey}:${key.privateKey}`;
  return { id: chat2queryApp.dataAppId, key: chat2queryKey };
}

export async function createDataAppAndKey({
  accessToken,
  clusterId,
  projectId,
  dataApps,
}: {
  accessToken: string;
  projectId: string;
  clusterId: string;
  dataApps: DataApp[];
}) {
  let tiinsightDataApp = dataApps.find(
    (i) => i.appType === "DATAAPP" && i.displayName === "TiInsight-DataApp",
  );
  if (!tiinsightDataApp) {
    tiinsightDataApp = await createUserDataApp({
      accessToken: accessToken!,
      clusterId,
      projectId,
      type: "DATAAPP",
      name: "TiInsight-DataApp",
    });
  } else if (!tiinsightDataApp.clusterIds.includes(clusterId)) {
    await addClusterToDataApp({
      accessToken: accessToken!,
      clusterId,
      id: tiinsightDataApp.dataAppId,
    });
  }
  const key = await createApiKey({
    id: tiinsightDataApp.dataAppId,
    accessToken: accessToken!,
    role: "READ_AND_WRITE",
  });
  const dataAppKey = `${key.publicKey}:${key.privateKey}`;

  const systenEndpoints = await getSystemEndpoint({
    id: tiinsightDataApp.dataAppId,
    accessToken: accessToken!,
  });

  if (
    !systenEndpoints.items.some(
      (i) =>
        i.type === "system-data" && i.key === "POST:/system/query" && i.enabled,
    )
  ) {
    await enableSystemEndpoint({
      id: tiinsightDataApp.dataAppId,
      accessToken: accessToken!,
    });
  }

  return { id: tiinsightDataApp.dataAppId, key: dataAppKey };
}
