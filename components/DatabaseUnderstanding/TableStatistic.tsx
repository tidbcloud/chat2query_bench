import {
  Box,
  Card,
  Divider,
  Group,
  Progress,
  Stack,
  Typography,
} from "@tidbcloud/uikit";

function StatItem({ name, value }: { name: string; value: string | number }) {
  return (
    <Group position="apart">
      <Typography variant="label-sm">{name}</Typography>
      <Typography variant="body-sm">{value}</Typography>
    </Group>
  );
}

export interface ColumnStat {
  name: string;
  type: string;
  count: number;
  distinct: number;
  missing: number;
  distribution: {
    unique?: number;
    enum?: { name: string; count: number }[];
    numerical?: Array<[string, string | number]>;
  };
}

export interface TableStatisticProps {
  stats: ColumnStat[];
}

export function TableStatistic({ stats }: TableStatisticProps) {
  return (
    <Group spacing={0} noWrap align="flex-start" w="100%">
      {stats.map((i) => (
        <Card key={i.name} withBorder w={200} h={330} p={0} radius={0}>
          <Box component="header" p={12}>
            <Typography variant="label-lg">{i.name}</Typography>
          </Box>
          <Divider />
          <Box p={12}>
            <StatItem name="Data type" value={i.type} />
            <StatItem name="Count" value={i.count} />
            <StatItem name="Distinct" value={i.distinct} />
          </Box>
          <Divider />
          {i.distribution.unique && (
            <Stack align="center" spacing={0} mt={24}>
              <Typography color="cyan" fw={700} size={32} lh="32px">
                {i.distribution.unique}
              </Typography>
              <Typography variant="body-sm">unique values</Typography>
            </Stack>
          )}
          {i.distribution.enum && (
            <Stack p={8}>
              {i.distribution.enum.map((k) => (
                <Stack key={k.name} spacing={0}>
                  <Group position="apart" noWrap>
                    <Typography variant="label-sm">{k.name}</Typography>
                    <Typography variant="body-sm">{k.count}</Typography>
                  </Group>
                  <Progress value={(k.count / i.count) * 100} />
                </Stack>
              ))}
            </Stack>
          )}
          {i.distribution.numerical && (
            <Stack p={8} spacing={4}>
              {i.distribution.numerical.map(([key, val]) => (
                <Stack key={key} spacing={0}>
                  <Group position="apart" noWrap>
                    <Typography variant="label-sm">{key}</Typography>
                    <Typography variant="body-sm">{val}</Typography>
                  </Group>
                </Stack>
              ))}
            </Stack>
          )}
        </Card>
      ))}
    </Group>
  );
}
