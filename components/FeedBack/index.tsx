import { Stack, Typography } from "@tidbcloud/uikit";

export function Feedback() {
  return (
    <Stack>
      <Typography variant="label-lg">
        Please send an email to{" "}
        <a href="mailto:tiinsight@pingcap.com">tiinsight@pingcap.com</a> if you
        have any feedback or questions. Thank you!
      </Typography>
    </Stack>
  );
}
