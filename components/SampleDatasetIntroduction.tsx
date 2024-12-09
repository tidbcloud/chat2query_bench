import { Accordion, Box, NavLink, Typography } from "@tidbcloud/uikit";
import { useState } from "react";
import { format } from "sql-formatter";
import { match } from "ts-pattern";
import { Prism } from "./QuestionBreakdown/Prism";

function SampleDatasetFinancialIntroduction() {
  return (
    <>
      <Typography>
        Welcome! This dataset provides detailed information on the U.S. Federal
        Reserve&apos;s federal funds rate, along with data on six key economic
        indicators.
      </Typography>
      <Typography>
        The U.S. Federal Reserve System regulates the federal funds rate, a
        critical factor influencing financial markets and the broader economy.
        Historically, the Federal Reserve has engaged in multiple cycles of Fed
        Rate Cuts and Fed Rate Hikes, each with significant repercussions for
        the economy and the daily lives of residents. Understanding these
        effects is crucial for{" "}
        <b>
          making informed decisions about asset allocation and investment
          strategies.
        </b>{" "}
        Below are the economic indicators included in this dataset for analyzing
        the impact of Federal Reserve policies:
      </Typography>
      <Typography>
        1. <b>Crude Oil Prices</b>: Reflects global supply and demand. Analyzing
        its relationship with interest rates helps understand the energy
        market&apos;s response to rate changes.
      </Typography>
      <Typography>
        2. <b>Gold Prices</b>: Often inversely related to interest rates.
        Changes in gold prices indicate market expectations and investor
        sentiment regarding economic conditions.
      </Typography>
      <Typography>
        3. <b>NASDAQ Composite Index</b>: Represents technology stocks. Its
        performance shows how Federal Reserve policies affect investor
        confidence and stock market growth.
      </Typography>
      <Typography>
        4. <b>Dow Jones Industrial Average (DJIA)</b>: Includes 30 large U.S.
        companies. Comparing DJIA with interest rate changes reveals the impact
        on traditional industries.
      </Typography>
      <Typography>
        5. <b>CSI 300</b>: Reflects 300 large-cap stocks in China&apos;s A-share
        market. Analyzing this index helps understand global economic
        connections and the international impact of Federal Reserve policies.
      </Typography>
      <Typography>
        6. <b>Unemployment Rate</b>: Indicates economic health. Examining its
        relationship with the federal funds rate evaluates the impact on the job
        market.
      </Typography>
      <Typography>
        For context, the most recent rate hike cycle occurred from{" "}
        <b>March 2022 to July 2023</b>, while the latest rate cut cycle took
        place from <b>August 2019 to March 2020</b>.
      </Typography>
    </>
  );
}

function SampleDatasetNewElearningIntroduction() {
  return (
    <>
      <Typography>
        This data source provides significant value by facilitating course
        management, analyzing student behavior, and evaluating instructor
        performance. Institutions can optimize course content, personalize
        learning experiences, and assess teaching effectiveness based on student
        outcomes.
      </Typography>
      <Typography>
        Potential insights include identifying popular courses, uncovering
        performance trends, and exploring the relationship between gender and
        academic success. Overall, this data source empowers educational
        institutions to enhance quality and drive continuous improvement in
        learning experiences.
      </Typography>
    </>
  );
}

export const SAMPLE_DATASET_INTRODUCTION: Record<string, React.ReactNode> = {
  financial: <SampleDatasetFinancialIntroduction />,
  new_e_learning: <SampleDatasetNewElearningIntroduction />,
};

function KnowledgeBase({
  data,
}: {
  data: {
    terms: Array<{ term: string; explanation: string }>;
    instructions: Array<{ title: string; content: string }>;
    fewShots: Array<{ question: string; answer: string }>;
  };
}) {
  const [current, setCurrent] = useState<
    "term_sheet" | "instruction" | "few_shots"
  >("term_sheet");
  return (
    <Box sx={{ display: "flex", flexDirection: "row", gap: 8 }}>
      <Box h="100%" miw={140} sx={{ flexShrink: 0 }}>
        <NavLink
          label="Term Sheet"
          active={current === "term_sheet"}
          onClick={() => setCurrent("term_sheet")}
        />
        <NavLink
          label="Instruction"
          active={current === "instruction"}
          onClick={() => setCurrent("instruction")}
        />
        <NavLink
          label="Few-Shots"
          active={current === "few_shots"}
          onClick={() => setCurrent("few_shots")}
        />
      </Box>

      <Box sx={{ flexGrow: 1, overflow: "auto" }} h="100%">
        {match(current)
          .with("term_sheet", () => (
            <Accordion
              defaultValue={data.terms[0].term}
              variant="filled"
              sx={(theme) => ({ backgroundColor: theme.white })}
            >
              {data.terms.map((term) => (
                <Accordion.Item key={term.term} value={term.term}>
                  <Accordion.Control>
                    <Typography variant="label-lg">{term.term}</Typography>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Typography>{term.explanation}</Typography>
                  </Accordion.Panel>
                </Accordion.Item>
              ))}
            </Accordion>
          ))
          .with("instruction", () => (
            <Accordion
              variant="filled"
              defaultValue={data.instructions[0].title}
              sx={(theme) => ({ backgroundColor: theme.white })}
            >
              {data.instructions.map((instruction) => (
                <Accordion.Item
                  key={instruction.title}
                  value={instruction.title}
                >
                  <Accordion.Control>
                    <Typography variant="label-lg">
                      {instruction.title}
                    </Typography>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Typography>{instruction.content}</Typography>
                  </Accordion.Panel>
                </Accordion.Item>
              ))}
            </Accordion>
          ))
          .with("few_shots", () => (
            <Accordion
              variant="filled"
              defaultValue={data.fewShots[0].question}
              sx={(theme) => ({ backgroundColor: theme.white })}
            >
              {data.fewShots.map((fewShot) => (
                <Accordion.Item key={fewShot.question} value={fewShot.question}>
                  <Accordion.Control>
                    <Typography variant="label-lg">
                      {fewShot.question}
                    </Typography>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Prism>{format(fewShot.answer)}</Prism>
                  </Accordion.Panel>
                </Accordion.Item>
              ))}
            </Accordion>
          ))
          .exhaustive()}
      </Box>
    </Box>
  );
}

const SAMPLE_DATASET_KNOWLEDGE_BASE_DATA = {
  financial: {
    terms: [
      {
        term: "Fed Rate Cuts",
        explanation:
          "It is a monetary policy action taken by the U.S. Federal Reserve to reduce the federal funds rate. This rate is the interest at which banks lend to each other overnight.",
      },
      {
        term: "Fed Rate Hikes",
        explanation:
          "It is a monetary policy action taken by the U.S. Federal Reserve to increase the federal funds rate. This rate is the interest at which banks lend to each other overnight.",
      },
      {
        term: "Rate Cut Cycle",
        explanation:
          "A rate cut cycle refers to a series of reductions in federal funds rates by the Federal Reserve, over a specific period.",
      },
      {
        term: "Rate Hike Cycle",
        explanation:
          "A rate hike cycle refers to a series of increases in federal funds rates by the Federal Reserve, over a specific period.",
      },
      {
        term: "Financial Assets & Economic Indicators",
        explanation:
          "These terms refer to key market instruments and benchmarks such as Crude Oil, Gold, NASDAQ, DJIA (Dow Jones Industrial Average), and CSI 300 (China Securities Index 300).",
      },
    ],
    instructions: [
      {
        title: "Instruction 1",
        content:
          'When the task is about analyzing the "impact of fed rate hikes or cuts on assets", if no specific period for the rate hikes or cuts is mentioned, assume that the **rate hikes** refer to the most recent hike cycle (March 2022 to August 2023) and the **rate cuts** refer to the most recent cut cycle (August 2019 to March 2020). If no specific financial asset is mentioned,  assume the analysis to comprise the following: ** Crude Oil, Gold, NASDAQ, DJIA, and CSI 300**. **The impact on assets** is defined as the analysis of the growth rate of the closing price for each of these assets over three distinct time periods: one month prior to the specified period, during the specified period, and one month following the specified period.',
      },
      {
        title: "Instruction 2",
        content:
          'When the task is about analyzing the "performance of assets during fed rate hikes or rate cuts", if no specific period for the rate hikes or cuts is mentioned, assume that the **rate hikes** refer to the most recent hike cycle (March 2022 to August 2023) and the **rate cuts** refer to the most recent cut cycle (August 2019 to March 2020). If no specific financial asset is mentioned,  assume the analysis to comprise the following: ** Crude Oil, Gold, NASDAQ, DJIA, and CSI 300**. **Performance of assets** is defined as the analysis of the growth rate of the closing price for that asset over a specified rate hikes or cuts cycle. (Task Clarification)',
      },
      {
        title: "Instruction 3",
        content:
          "When tasked with calculating **the growth rate of a price indicator (like close, high, low)** over a period, you need to identify the first and last dates within this period for which data is available for assets, as well as their closing prices. Then, use the following formula to calculate the growth rate: (Last Closing Price - First Closing Price) / First Closing Price * 100.",
      },
      {
        title: "Instruction 4",
        content:
          "The date associated with the federal funds rate is recorded monthly in the fedfunds table, formatted as: YYYY-mm-01. When comparing this rate with other data(eg: unemployment rate, close price), ensure that you also use monthly data, such as the monthly averages, for consistency.",
      },
    ],
    fewShots: [
      {
        question:
          "Calculate the growth rate in closing prices for CSI 30 for the specific period (March 2022 to July 2023)",
        answer:
          "SELECT ((last_day.close - first_day.close) / first_day.close) * 100 AS growth_rate FROM (SELECT close FROM `csi300` WHERE `date` >= '2022-03-01' ORDER BY `date` ASC LIMIT 1) AS first_day, (SELECT close FROM `csi300` WHERE `date` <= '2023-07-31' ORDER BY `date` DESC LIMIT 1) AS last_day;",
      },
      {
        question:
          "Compare the federal funds rate with unemployment rate for the past year",
        answer:
          "SELECT f.date AS month, AVG(u.rate) AS average_unemployment_rate, f.rate AS federal_funds_rate FROM fedfunds f JOIN unrate u ON f.date = u.date WHERE f.date >= DATEADD(month, -12, GETDATE()) GROUP BY f.date, f.rate ORDER BY f.date;",
      },
    ],
  },
};

export const SAMPLE_DATASET_KNOWLEDGE_BASE: Record<string, React.ReactNode> = {
  financial: (
    <KnowledgeBase data={SAMPLE_DATASET_KNOWLEDGE_BASE_DATA.financial} />
  ),
};
