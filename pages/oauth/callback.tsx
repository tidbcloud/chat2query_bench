import dynamic from "next/dynamic";

const App = dynamic(() => import("~/components/OauthCallback"), {
  ssr: false,
});

export const config = {
  ssr: false,
};

export default function Page() {
  return <App />;
}
