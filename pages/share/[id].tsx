import dynamic from "next/dynamic";

const Share = dynamic(() => import("~/components/SharePage"), { ssr: false });

export default function Page() {
  return <Share />;
}
