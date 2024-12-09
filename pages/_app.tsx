import "~/styles/globals.css";

import "../components/Visualizer/style/flow.css";
import "../components/Visualizer/style/react-flow.scss";
import "../components/Visualizer/style/table.scss";
import "../components/Visualizer/style/column-name.scss";
import "../components/Visualizer/style/info-popup.scss";
import "../components/Visualizer/style/has-one-edge.scss";
import "../components/Visualizer/style/has-many-edge.scss";
import "../components/Visualizer/style/key-icon.css";
import "../components/Visualizer/style/handle.css";

import { Analytics } from "@vercel/analytics/react";
import type { AppProps, AppType } from "next/app";
import dynamic from "next/dynamic";
import React from "react";

import { trpcNextClient } from "~/utils/trpc.next";

const AppProvider = dynamic(
  () => import("~/components/Provider").then((mod) => mod.AppProvider),
  { ssr: false },
);

const App: AppType = ({ Component, pageProps }: AppProps) => {
  return (
    <AppProvider>
      <Component {...pageProps} />
      <Analytics />
    </AppProvider>
  );
};

export default trpcNextClient.withTRPC(App);
