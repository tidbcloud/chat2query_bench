import { Stack, Tabs, Typography } from "@tidbcloud/uikit";

import type { DatabaseUnderstandingV2 } from "~/server/api";
import { useAppSelector } from "~/store";
import { selectCurrentSession } from "~/store/selector";

import {
  SAMPLE_DATASET_INTRODUCTION,
  SAMPLE_DATASET_KNOWLEDGE_BASE,
} from "../SampleDatasetIntroduction";
import { DatabaseConfig } from "../Visualizer/types";

import { DataSummary } from "./DataSummary";
import { DatabaseSchema } from "./DatabaseSchema";

export interface DatabaseUnderstandingMessageProps {
  meta: DatabaseUnderstandingV2;
  isCanvasMode?: boolean;
}

export function toDatabaseSchema(
  meta: DatabaseUnderstandingV2,
): DatabaseConfig {
  const _tables = Object.values(meta.tables);
  const tables = _tables.map((t) => {
    return {
      schema: "public",
      schemaColor: "#91C4F2",
      name: t.name,
      description: t.description,
      columns: Object.values(t.columns).map((c) => ({
        name: c.name,
        description: c.description,
        type: "text",
      })),
    };
  });

  const tableCount = tables.length;
  const tablesPerRow = Math.round(Math.sqrt(tableCount));
  const tablePositions = tables.reduce((acc, table, index) => {
    const yPosition = Math.floor(index / tablesPerRow);
    const xPosition = index % tablesPerRow;
    //@ts-ignore
    acc[table.name] = {
      x: xPosition * 300,
      y: yPosition * 450,
    };
    return acc;
  }, {});

  return {
    tables,
    edgeConfigs: [],
    schemaColors: {
      DEFAULT: "#91C4F2",
    },
    tablePositions,
  };
}

export const DatabaseUnderstandingMessage = ({
  meta,
  isCanvasMode,
}: DatabaseUnderstandingMessageProps) => {
  const db = meta;
  const convo = useAppSelector(selectCurrentSession);
  console.log(convo);

  if (!db) {
    return null;
  }

  return (
    <Tabs defaultValue="summary" w="100%">
      <Tabs.List>
        <Tabs.Tab value="summary">Summary</Tabs.Tab>
        <Tabs.Tab value="schema">Schema</Tabs.Tab>
        {convo.isSample &&
          convo.sampleDbName &&
          convo.sampleDbName in SAMPLE_DATASET_INTRODUCTION && (
            <Tabs.Tab value="details">Details</Tabs.Tab>
          )}
        {convo.isSample &&
          convo.sampleDbName &&
          convo.sampleDbName in SAMPLE_DATASET_KNOWLEDGE_BASE && (
            <Tabs.Tab value="knowledge">Knowledge Base</Tabs.Tab>
          )}
      </Tabs.List>

      <Tabs.Panel value="summary" pt={8}>
        <DataSummary db={db} />
      </Tabs.Panel>

      <Tabs.Panel value="schema" pt={8}>
        <DatabaseSchema schema={db.tables} isCanvasMode={isCanvasMode} />
      </Tabs.Panel>

      <Tabs.Panel value="details" pt={8}>
        <Stack spacing={8}>
          {SAMPLE_DATASET_INTRODUCTION[convo.sampleDbName!]}
        </Stack>
      </Tabs.Panel>

      <Tabs.Panel value="knowledge" pt={8}>
        <Typography mb={16}>
          A knowledge base is a collection of structured data that can be used
          to enhance generation capabilities of TiInsight.
        </Typography>
        {SAMPLE_DATASET_KNOWLEDGE_BASE[convo.sampleDbName!]}
      </Tabs.Panel>
    </Tabs>
  );
};
