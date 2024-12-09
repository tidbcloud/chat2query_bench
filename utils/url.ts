import { SampleDatasetConfig } from "./env";

export const getDbName = (dbUri: string) => {
  let urlObj = new URL(dbUri);
  urlObj.protocol = "https:";
  const obj = new URL(urlObj.toString());
  return obj.pathname.slice(1);
};

export const isSampleDataset = (dbUri: string | null): [boolean, string] => {
  if (!dbUri) {
    return [false, ""];
  }
  const sampledb = new URL(SampleDatasetConfig.dbUri);
  const url = new URL(dbUri.replace("mysql://", "http://"));
  return [
    url.username === sampledb.username && url.password === sampledb.password,
    url.pathname.slice(1),
  ];
};
