import { notifier } from "@tidbcloud/uikit";
import { useMount } from "ahooks";
import { useRouter } from "next/router";
import { actions, useAppDispatch } from "~/store";
import { trpcClient } from "~/utils/trpc.vanilla";

export default function OauthCallback() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  useMount(async () => {
    const url = new URL(window.location.href);
    const state = url.searchParams.get("state")!;
    const code = url.searchParams.get("code")!;
    try {
      const data = await trpcClient.tidbcloudOauthCallback.mutate({
        state,
        code,
        redirectUri: `${window.location.origin}/oauth/callback`,
      });

      dispatch(
        actions.account.saveUser({
          ...data,
          isGuest: false,
        }),
      );

      router.push("/");
    } catch (e) {
      if (e instanceof Error) {
        notifier.error(e.message);
      }
    }
  });

  return <main>redirecting...</main>;
}
