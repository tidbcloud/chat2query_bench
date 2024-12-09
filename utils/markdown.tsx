import { compiler } from "markdown-to-jsx";

import { DatabaseUnderstandingMessage } from "~/components/DatabaseUnderstanding";
import { DatasetSwitched } from "~/components/DatasetSwitched";
import { QuestionBreakdownMessage } from "~/components/QuestionBreakdown";

export const parse = (s: string, props: any) => {
  return compiler(s, {
    overrides: {
      DatabaseUnderstanding: () => <DatabaseUnderstandingMessage {...props} />,
      QuestionBreakdown: () => <QuestionBreakdownMessage {...props} />,
      DatasetSwitched: () => <DatasetSwitched {...props} />,
    },
  });
};
