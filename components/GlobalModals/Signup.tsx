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
import { useState } from "react";
import { actions, useAppDispatch, useAppSelector } from "~/store";
import { trpcNextClient } from "~/utils/trpc.next";
import { Signin } from "./Signin";

export const Signup = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.account.user);
  const signup = trpcNextClient.signup.useMutation();

  const [page, setPage] = useState<"signin" | "signup">(
    user?.isGuest ? "signup" : "signin",
  );

  const { data } = trpcNextClient.getTidbCloudOauthSigninUrl.useQuery({
    redirectUrl: `${window.location.origin}/oauth/callback`,
  });

  const onSubmitSignup = async (data: { email: string; password: string }) => {
    try {
      const user = await signup.mutateAsync(data);
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

  if (page === "signin") {
    return <Signin onSwitchSignup={() => setPage("signup")} />;
  }

  if (user?.isGuest) {
    return (
      <Form onSubmit={onSubmitSignup} withActions={false}>
        <Stack>
          <Typography variant="body-md">
            You are currently signed in as <b>Guest</b>, sign up with TiDB Cloud
            to directly connect to your database and unlock more features.
          </Typography>

          <Button
            variant="default"
            onClick={async () => {
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
            Sign up with TiDB Cloud
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
            autoComplete="current-password"
            placeholder="Enter your password"
          />
        </Stack>

        <Stack spacing={8}>
          <Button type="submit" loading={signup.isLoading}>
            Sign up
          </Button>
          <Typography variant="body-sm">
            Already have an account?{" "}
            <Anchor onClick={() => setPage("signin")}>Sign in</Anchor>
          </Typography>
        </Stack>
      </Form>
    );
  }
  return (
    <Stack>
      <Typography variant="body-lg">
        You are currently signed in as <b>{user?.email}</b>
      </Typography>

      {/* <Button variant="default" onClick={handleSignout}>
        Sign out
      </Button> */}
    </Stack>
  );
};
