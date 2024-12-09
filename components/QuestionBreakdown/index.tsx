import {
  Chat2DataBreakdownAnswer,
  Chat2DataResolvedAnswer,
  isResolvedAnswer,
} from "~/server/api";

import { TaskResult } from "./TaskResult";
import { TaskSummary } from "./TaskSummary";

export interface QuestionBreakdownProps {
  meta: Chat2DataBreakdownAnswer | Chat2DataResolvedAnswer;
  messageId: string;
}

export const QuestionBreakdownMessage = (props: QuestionBreakdownProps) => {
  const { meta, messageId } = props;
  const isResolved = isResolvedAnswer(meta);
  if (!meta) {
    return `Oops! Looks like we encountered a hiccup in fetching the data from our servers. Please try again later, and we'll do our best to ensure a better data experience.`;
  }

  if (!isResolved) {
    return <TaskSummary task={meta} />;
  }

  return (
    <TaskResult
      messageId={messageId}
      task={meta}
      chartOnly={window.location.pathname !== "/"}
    />
  );
};
