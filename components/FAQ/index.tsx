import { Accordion, Button, Group, Stack } from "@tidbcloud/uikit";

const faq = [
  {
    q: "What is TiInsight?",
    a: "TiInsight is a data analysis service built with TiDB Cloud and OpenAI. It analyzes your database and provides an interface for querying your database using natural language to gain insights and perform data analysis tasks",
  },
  {
    q: "What features does TiInsight have?",
    a: "TiInsight offers a range of features including natural language querying, data visualization, data exploration, and data analysis capabilities.",
  },
  {
    q: "How does TiInsight work?",
    a: "TiInsight leverages the power of TiDB Cloud and OpenAI to analyze your database. It utilizes natural language processing techniques to understand queries and provides a user-friendly interface for interacting with the data.",
  },
  {
    q: "What is the tech stack behind TiInsight?",
    a: "TiInsight is built with TiDB Cloud, which is a cloud platform that provides distributed SQL database solutions, and incorporates OpenAI's language models for natural language processing and understanding.",
  },
  {
    q: "What is TiDB Cloud and Data Service?",
    a: "TiDB Cloud is a fully-managed Database-as-a-Service (DBaaS) powered by TiDB, bringing a MySQL-compatible serverless hybrid transaction/analytics processing (HTAP) cloud database, to your business. It handles complex tasks such as infrastructure management and cluster deployment for you and offers automated operations, elastic scalability, and performance optimization. Data Service refers to the functionality and capabilities provided by TiDB Cloud for managing and analyzing your data.",
  },
  {
    q: "How can I build my own TiInsight?",
    a: "To build your own TiInsight-like service, you can leverage TiDB Cloud for the managed database infrastructure and utilize OpenAI's language models to develop natural language processing capabilities. You can then design an interface to interact with the database and provide data analysis functionalities based on your specific requirements.",
  },
];

export function FAQ() {
  return (
    <Stack>
      <Accordion defaultValue={faq[0].a}>
        {faq.map((i) => (
          <Accordion.Item value={i.q} key={i.q}>
            <Accordion.Control>{i.q}</Accordion.Control>
            <Accordion.Panel>{i.a}</Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>

      <Group position="right">
        <Button variant="default" size="xs">
          Close
        </Button>
      </Group>
    </Stack>
  );
}
