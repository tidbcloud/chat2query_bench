import { Skeleton, Stack } from "@tidbcloud/uikit";

export function NodeLoadingSkeleton() {
  return (
    <Stack spacing={8} w={600}>
      <Skeleton height={24} radius="xl" width="20%" />
      <Skeleton height={12} radius="xl" />
      <Skeleton height={12} radius="xl" />
      <Skeleton height={12} radius="xl" />
      <Skeleton height={8} width="70%" radius="xl" />
    </Stack>
  );
}
