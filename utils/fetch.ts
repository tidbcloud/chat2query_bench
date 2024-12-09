import JSONBig from "json-bigint";
import DigestClient from "with-digest-fetch";

import { NextApiRequest } from "next";
import { PrivateEnvVariables, SampleDatasetConfig } from "./env";

// store big int as string so front end doesn't need to change
const json = JSONBig({ storeAsString: true, constructorAction: "preserve" });

export const getDataAppHost = (dataAppId: string, region: string) =>
  `${PrivateEnvVariables.TidbCloudDataAppEndpointHost.replace(
    "us-west-2",
    region,
  )}/${dataAppId}/endpoint`;

export const nodeFetch = async (
  url: string,
  options: Omit<RequestInit, "body"> & {
    auth?: string;
    host?: string;
    body?: Record<string, any>;
  },
) => {
  const auth = options.auth || SampleDatasetConfig.auth;
  const client = new DigestClient(...(auth.split(":") as [string, string]));
  const path = url.startsWith("http")
    ? url
    : `${options.host ?? SampleDatasetConfig.dataAppHost}${url}`;

  console.log("auth:", auth);
  console.log("request path:", path);
  console.log("request body:", options.body);

  try {
    const res = await client.fetch(path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const t = await res.text();

    if (!res.ok) {
      throw new Error(`Failed to fetch ${path}: ${res.statusText}, ${t}`, {
        cause: res,
      });
    }

    return json.parse(t);
  } catch (e) {
    if (e instanceof Error) {
      console.log("Error when fetching eda service: ", e);
    }
    throw e;
  }
};

export function reuseHeader(req: NextApiRequest) {
  const model = req.headers["x-override-ai-model"] as string;
  console.log("using model: ", model);
  return {
    "X-Override-AI-Model": model,
  };
}
