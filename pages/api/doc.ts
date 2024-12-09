import type { NextApiRequest, NextApiResponse } from "next";
import { PrivateEnvVariables } from "~/utils/env";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const result = await fetch(PrivateEnvVariables.OpenApiDoc);
  res.status(200).json(await result.json());
}
