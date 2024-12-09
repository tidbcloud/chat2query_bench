import { useMantineTheme } from "@tidbcloud/uikit";
import { useMediaQuery } from "@tidbcloud/uikit/hooks";

export function useLargeScreen() {
  const theme = useMantineTheme();
  const largeScreen = useMediaQuery(`(min-width: ${theme.breakpoints.sm}px)`);
  return largeScreen;
}
