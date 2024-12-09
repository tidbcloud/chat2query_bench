import dynamic from "next/dynamic";
import { Inter } from "next/font/google";
import Head from "next/head";

const App = dynamic(() => import("~/components/App").then((mod) => mod.App), {
  ssr: false,
});

export const config = {
  ssr: false,
};

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  return (
    <main className={inter.className}>
      <Head>
        <title>TiInsight | Your AI-powered data analyst</title>
      </Head>
      <App />
    </main>
  );
}
