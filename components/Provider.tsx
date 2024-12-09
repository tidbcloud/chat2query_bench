import * as Sentry from "@sentry/nextjs";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  Button,
  Center,
  MantineProvider,
  NotificationsProvider,
  Stack,
} from "@tidbcloud/uikit";
import { Theme, themeColors } from "@tidbcloud/uikit/theme";
import React from "react";
import { Provider } from "react-redux";
import { persistStore } from "redux-persist";
import { PersistGate } from "redux-persist/integration/react";

import { actions, store } from "~/store";
import { queryClient } from "./QueryClient";

const persistor = persistStore(store);

class ErrorBoundary extends React.Component<any, { hasError: boolean }> {
  constructor(props: any) {
    super(props);

    // Define a state variable to track whether is an error or not
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    // You can use your own error logging service here
    console.log({ error, errorInfo });
    Sentry.captureException(error);
  }

  render() {
    // Check if the error is thrown
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <Center>
          <Stack mt={40}>
            <h2>Oops, there is an error!</h2>
            <Center>
              <Button
                type="button"
                variant="default"
                onClick={() => {
                  store.dispatch(actions.session.reset());
                  this.setState({ hasError: false });
                }}
              >
                Reload
              </Button>
            </Center>
          </Stack>
        </Center>
      );
    }

    // Return children components in case of no error

    return this.props.children;
  }
}

export const AppProvider = ({ children }: { children?: React.ReactNode }) => {
  return (
    <MantineProvider
      withGlobalStyles
      withNormalizeCSS
      theme={{
        ...Theme,
        colors: themeColors,
      }}
    >
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <ErrorBoundary>
            <NotificationsProvider position="top-right">
              <QueryClientProvider client={queryClient}>
                {children}
              </QueryClientProvider>
            </NotificationsProvider>
          </ErrorBoundary>
        </PersistGate>
      </Provider>
    </MantineProvider>
  );
};
