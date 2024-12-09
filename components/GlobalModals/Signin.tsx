import {
  Anchor,
  Button,
  Divider,
  Image,
  Stack,
  Typography,
  notifier,
} from "@tidbcloud/uikit";
import { Form, FormPasswordInput, FormTextInput } from "@tidbcloud/uikit/biz";
import { actions, useAppDispatch, useAppSelector } from "~/store";
import { trpcNextClient } from "~/utils/trpc.next";

interface SigninProps {
  onSwitchSignup: () => void;
}

export const Signin = ({ onSwitchSignup }: SigninProps) => {
  const user = useAppSelector((s) => s.account.user);
  const dispatch = useAppDispatch();

  const signin = trpcNextClient.signin.useMutation();
  const signout = trpcNextClient.signout.useMutation();
  const { data } = trpcNextClient.getTidbCloudOauthSigninUrl.useQuery({
    redirectUrl: `${window.location.origin}/oauth/callback`,
  });

  const onSigninSubmit = async (data: { email: string; password: string }) => {
    try {
      const user = await signin.mutateAsync(data);
      dispatch(
        actions.account.saveUser({
          ...user,
          isGuest: false,
        }),
      );

      notifier.success("Signed in successfully!");
      dispatch(actions.session.closeModal());
    } catch (e: any) {
      notifier.error(e.message);
    }
  };

  const onSignout = async () => {
    try {
      await signout.mutateAsync();
      dispatch(actions.account.saveUser(undefined));

      window.requestIdleCallback(() => {
        window.location.reload();
      });
    } catch (e) {
      if (e instanceof Error) {
        notifier.error(e.message);
      }
    }
  };

  if (!user?.isGuest) {
    return (
      <Stack>
        <Typography variant="body-lg">
          You are currently signed in as <b>{user?.email}</b>
        </Typography>

        <Button
          variant="default"
          onClick={onSignout}
          loading={signout.isLoading}
        >
          Sign out
        </Button>
      </Stack>
    );
  }

  return (
    <Form onSubmit={onSigninSubmit} withActions={false}>
      <Stack>
        <Typography variant="body-md">
          You are currently signed in as <b>Guest</b>, sign in to unlock more
          features.
        </Typography>
        <Button
          variant="default"
          onClick={() => {
            if (data?.url) {
              window.location.href = data.url;
            }
          }}
          leftIcon={
            <Image
              src="/tidbcloud.png"
              alt="TiDB Cloud"
              width={20}
              height={20}
            />
          }
        >
          Sign in with TiDB Cloud
        </Button>

        <Divider label="or" labelPosition="center" />

        <FormTextInput
          name="email"
          label="Email"
          placeholder="Enter your email"
        />
        <FormPasswordInput
          name="password"
          label="Password"
          placeholder="Enter your password"
        />
      </Stack>

      <Stack spacing={8}>
        <Button type="submit" loading={signin.isLoading}>
          Sign in
        </Button>
        <Typography variant="body-sm">
          {"Don't have an account? "}
          <Anchor onClick={onSwitchSignup}>Sign up</Anchor>
        </Typography>
      </Stack>
    </Form>
  );
};
