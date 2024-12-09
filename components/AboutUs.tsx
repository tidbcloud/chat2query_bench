import { Stack, Typography, Anchor } from "@tidbcloud/uikit";

export function AboutUs() {
  return (
    <Stack>
      <Typography variant="label-lg">TiDB Cloud Chat2Query</Typography>
      <Typography variant="body-lg">
        Powered by OpenAI’s GPT3 and TiDB Cloud, Chat2Query turns your natural
        language questions into powerful SQL queries and quickly returns the
        results, providing real-time and actionable insights for smarter
        business decisions. Unlike other AI SQL generators in the market,
        Chat2Query not only helps users generate SQL queries without extensive
        SQL knowledge, it also handles complex queries and offers real-time
        insights into dynamic datasets.
      </Typography>

      <Typography variant="label-lg">TiDB Cloud</Typography>
      <Typography variant="body-lg">
        TiDB Cloud is a fully-managed Database-as-a-Service (DBaaS) that brings
        TiDB, an open-source Hybrid Transactional and Analytical Processing
        (HTAP) database, to your cloud. TiDB Cloud offers an easy way to deploy
        and manage databases to let you focus on your applications, not the
        complexities of the databases. You can create TiDB Cloud clusters to
        quickly build mission-critical applications on Google Cloud and Amazon
        Web Services (AWS).
      </Typography>

      <Stack spacing={4}>
        <Anchor
          size="sm"
          href="https://docs.pingcap.com/tidbcloud"
          target="_blank"
        >
          Learn more about TiDB Cloud
        </Anchor>
        <Anchor size="sm" href="https://tidbcloud.com" target="_blank">
          Start to try TiDB Cloud
        </Anchor>
      </Stack>
    </Stack>
  );
}
