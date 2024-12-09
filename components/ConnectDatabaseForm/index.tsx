import { useForm } from "@mantine/form";
import {
  Button,
  FileButton,
  Group,
  Loader,
  NumberInput,
  PasswordInput,
  Popover,
  SegmentedControl,
  Select,
  Stack,
  TextInput,
  Textarea,
  Typography,
  notifier,
} from "@tidbcloud/uikit";
import { useMemoizedFn } from "ahooks";
import { useState } from "react";
import { match } from "ts-pattern";

import { actions, useAppDispatch, useAppSelector } from "~/store";
import { DatasetSwitchedMessage } from "~/utils/message";
import { trpcNextClient } from "~/utils/trpc.next";
import { getDbName } from "~/utils/url";
import { DatasetSwitchedMessageProps } from "../DatasetSwitched";

interface ConnectDatabaseFormProps {
  onClose: () => void;
}

interface FormValues {
  type: "tidb" | "mysql" | "pg" | "bigquery" | "singlestoredb";
  db_uri: string;
  host: string;
  port?: number;
  db: string;
  user: string;
  password: string;
}

const Protocols: Record<FormValues["type"], string> = {
  tidb: "mysql:",
  mysql: "mysql:",
  pg: "postgres:",
  singlestoredb: "singlestoredb:",
  bigquery: "bigquery:",
};

const Placeholders: Record<FormValues["type"], Partial<FormValues>> = {
  tidb: {
    port: 4000,
  },
  mysql: {
    port: 3306,
  },
  pg: {
    port: 5432,
  },
  singlestoredb: {
    port: 3306,
  },
  bigquery: {},
};

async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      resolve(content as string);
    };
    reader.onerror = (err) => {
      reject(err);
    };
    reader.readAsText(file);
  });
}

export function ConnectDatabaseURI({ onClose }: ConnectDatabaseFormProps) {
  const dispatch = useAppDispatch();
  const currentConversationId = useAppSelector(
    (s) => s.session.currentConversationId,
  );
  // const [testing, setTesting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [opened, setOpened] = useState(false);

  const initialValues: FormValues = {
    type: "tidb",
    db_uri: "",
    host: "",
    port: undefined,
    db: "",
    user: "",
    password: "",
  };

  const form = useForm({
    initialValues,
    validate: {
      host: (val) => !val && "Required",
      port: (val, values) => !val && values.type !== "bigquery" && "Required",
      db: (val, values) => !val && values.type !== "bigquery" && "Required",
      user: (val, values) => !val && values.type !== "bigquery" && "Required",
      password: (val, values) =>
        !val && values.type !== "bigquery" && "Required",
      db_uri: (val, values) => {
        if (!val) return null;

        try {
          const u = new URL(val);
          if (u.protocol !== Protocols[values.type!]) {
            return "Wrong protocol";
          }
          if (
            !u.username ||
            !u.password ||
            !u.hostname ||
            !u.port ||
            !u.pathname
          ) {
            throw new Error();
          }
          return null;
        } catch {
          return `Format should be like: "protocol://username:password@host:port/database"`;
        }
      },
    },
  });
  const type = form.values.type;

  const bindDatabase = trpcNextClient.bindDatabase.useMutation();
  const getDbUrl = async () => {
    let db_uri = `${Protocols[form.values.type]}//${form.values.user}:${
      form.values.password
    }@${form.values.host}:${form.values.port}/${form.values.db}`;

    if (type === "tidb") {
      db_uri += `?ssl_ca=%2Fetc%2Fssl%2Fcerts%2Fca-certificates.crt&ssl_verify_identity=true`;
    } else if (type === "bigquery") {
      if (file) {
        const content = await readFileAsText(file);
        db_uri = `${Protocols[form.values.type]}//${
          form.values.host
        }?credentials_base64=${btoa(content)}`;
      }
    }

    return db_uri;
  };

  const onUrlConfirm = useMemoizedFn(() => {
    const uri = form.values.db_uri;
    if (!uri) return;

    const res = form.validateField("db_uri");
    if (res.hasError) return;

    const uriObj = new URL(uri);
    // to let it parse username and password
    uriObj.protocol = "https:";
    const obj = new URL(uriObj.toString());
    form.setFieldValue("host", obj.hostname);
    form.setFieldValue("port", Number(obj.port));
    form.setFieldValue("db", obj.pathname.slice(1));
    form.setFieldValue("user", obj.username);
    form.setFieldValue("password", obj.password);

    setOpened(false);
  });

  const onSubmit = useMemoizedFn(async (values: typeof initialValues) => {
    if (type === "bigquery" && !file) {
      notifier.error("json key file is needed!");
      return;
    }

    try {
      setCreating(true);
      const dbUri = await getDbUrl();

      const data = await bindDatabase.mutateAsync({
        uri: dbUri,
        id: currentConversationId,
      });

      const dbName = data?.dbName ?? getDbName(dbUri);

      dispatch(
        actions.session.bindDatabaseSummary({
          id: currentConversationId,
          context: data!,
        }),
      );

      const meta = { meta: { dbName: dbName } } as DatasetSwitchedMessageProps;
      dispatch(
        actions.session.receivedMessage(
          DatasetSwitchedMessage,
          currentConversationId,
          meta,
        ),
      );

      onClose?.();
    } catch (e) {
      if (e instanceof Error) {
        dispatch(
          actions.session.receivedMessage(e.message, currentConversationId),
        );
      }
    } finally {
      setCreating(false);
    }
  });

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack>
        <Select
          label="Database type"
          data={[
            { label: "TiDB Cloud", value: "tidb" },
            { label: "MySQL", value: "mysql" },
            // {
            //   label: "BigQuery",
            //   value: "bigquery",
            // },
          ]}
          {...form.getInputProps("type")}
          size="xs"
        />

        {match(type)
          .with("bigquery", () => (
            <>
              <TextInput
                label="Dataset"
                placeholder="sonic"
                size="xs"
                {...form.getInputProps("host")}
              />
              <Stack spacing={0}>
                <Typography variant="label-md">Json Key</Typography>
                <FileButton onChange={setFile} accept=".json">
                  {(props) => (
                    <Button {...props} variant="default" size="xs">
                      {file ? file.name : "Choose a file"}
                    </Button>
                  )}
                </FileButton>
              </Stack>
            </>
          ))
          .otherwise(() => (
            <>
              <Group grow>
                <TextInput
                  label="Host"
                  placeholder="mydatabase.com"
                  size="xs"
                  {...form.getInputProps("host")}
                />
                <NumberInput
                  label="Port"
                  placeholder={String(Placeholders[type].port) ?? ""}
                  size="xs"
                  {...form.getInputProps("port")}
                />
                <TextInput
                  label="Database"
                  placeholder="mydb"
                  size="xs"
                  {...form.getInputProps("db")}
                />
              </Group>

              <Group grow>
                <TextInput
                  label="User"
                  placeholder="user name"
                  size="xs"
                  {...form.getInputProps("user")}
                />
                <PasswordInput
                  label="Password"
                  placeholder="password"
                  size="xs"
                  {...form.getInputProps("password")}
                />
              </Group>
            </>
          ))}

        <Group position="apart">
          <Popover
            width="min(500px, 100vw)"
            position="bottom"
            withArrow
            shadow="md"
            opened={opened}
            onChange={setOpened}
          >
            <Popover.Target>
              <Button
                size="xs"
                variant="default"
                onClick={() => setOpened((o) => !o)}
                sx={{
                  visibility: ["mysql", "tidb"].includes(type)
                    ? "visible"
                    : "hidden",
                }}
              >
                Connect from URL
              </Button>
            </Popover.Target>
            <Popover.Dropdown>
              <Stack>
                <Textarea
                  label="Database URL"
                  placeholder="mysql://username:password@localhost:4000/mydb"
                  {...form.getInputProps("db_uri")}
                  minRows={5}
                  styles={{
                    input: { lineHeight: "20px", wordBreak: "break-all" },
                  }}
                />
                <Group position="right">
                  <Button size="xs" variant="default" onClick={onUrlConfirm}>
                    Confirm
                  </Button>
                </Group>
              </Stack>
            </Popover.Dropdown>
          </Popover>

          <Group>
            {/* <Button
              size="xs"
              variant="default"
              loading={testing}
              onClick={onTestConnection}
            >
              Test Connection
            </Button> */}
            <Button size="xs" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button size="xs" type="submit" loading={creating}>
              Confirm
            </Button>
          </Group>
        </Group>
      </Stack>
    </form>
  );
}

export function ConnectTidbServerlessForm({
  onClose,
}: { onClose: () => void }) {
  const dispatch = useAppDispatch();
  const form = useForm({
    initialValues: {
      cluster: "",
      database: "",
    },
  });
  const convoId = useAppSelector((s) => s.session.currentConversationId);

  const connect = trpcNextClient.connectToServerlessCluster.useMutation();
  const bindDatabase = trpcNextClient.bindDatabase.useMutation();
  const { data, isFetching: isLoadingCluster } =
    trpcNextClient.listTidbCloudClusters.useQuery();
  const options =
    data?.clusters.map((c) => ({
      label: c.displayName,
      value: c.clusterId,
    })) ?? [];

  const clusterId = form.values.cluster;
  const [projectId, region] = (() => {
    const cluster = data?.clusters.find(
      (c) => c.clusterId === form.values.cluster,
    );

    return [
      cluster?.labels["tidb.cloud/project"] ?? "",
      cluster?.region.regionId ?? "",
    ];
  })();

  const result = trpcNextClient.showDatabasesOfCluster.useQuery(
    {
      clusterId,
      projectId,
      region,
    },
    {
      enabled: Boolean(clusterId) && Boolean(projectId),
      onError(err) {
        notifier.error(`Failed to connect to the cluster, ${err.message}`);
      },
    },
  );

  const { data: dbData, isFetching } = result;
  const onSubmit = useMemoizedFn(async (formValues) => {
    try {
      await connect.mutateAsync({
        projectId,
        clusterId: formValues.cluster,
        database: formValues.database,
        convoId,
      });

      const data = await bindDatabase.mutateAsync({
        id: convoId,
      });

      const dbName = formValues.database;

      dispatch(
        actions.session.bindDatabaseSummary({
          id: convoId,
          context: data!,
        }),
      );

      dispatch(
        actions.session.receivedMessage(DatasetSwitchedMessage, convoId, {
          meta: { dbName: dbName, isSample: false },
        }),
      );

      onClose();
    } catch (e) {
      if (e instanceof Error) {
        notifier.error(`Failed to connect to the cluster, ${e.message}`);
      }
    }
  });

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Select
        label="Select a cluster"
        data={options}
        {...form.getInputProps("cluster")}
        size="xs"
        mb={16}
        placeholder="cluster"
        icon={isLoadingCluster ? <Loader size="xs" /> : null}
      />

      <Select
        name="database"
        data={dbData ?? []}
        label="Select a database"
        placeholder="database"
        icon={isFetching ? <Loader size="xs" /> : null}
        disabled={isFetching || !clusterId}
        size="xs"
        mb={16}
        {...form.getInputProps("database")}
      />

      <Group position="right">
        <Button size="xs" type="button" variant="default" onClick={onClose}>
          Cancel
        </Button>
        <Button
          size="xs"
          type="submit"
          loading={isFetching || connect.isLoading || bindDatabase.isLoading}
          disabled={isFetching || !clusterId || !projectId}
        >
          Confirm
        </Button>
      </Group>
    </form>
  );
}

export function ConnectDatabaseForm({ onClose }: { onClose: () => void }) {
  const [type, setType] = useState<"manual" | "oauth">("oauth");

  return (
    <Stack>
      <SegmentedControl
        data={[
          { label: "Connect to TiDB Serverless", value: "oauth" },
          { label: "Connect to my own database", value: "manual" },
        ]}
        value={type}
        onChange={(val) => setType(val as any)}
      />
      {match(type)
        .with("manual", () => <ConnectDatabaseURI onClose={onClose} />)
        .with("oauth", () => <ConnectTidbServerlessForm onClose={onClose} />)
        .exhaustive()}
    </Stack>
  );
}
