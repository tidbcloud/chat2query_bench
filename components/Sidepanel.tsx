import {
  ActionIcon,
  Affix,
  Badge,
  Box,
  Button,
  Center,
  Drawer,
  Group,
  Image,
  Input,
  Loader,
  Modal,
  ScrollArea,
  Stack,
  Tooltip,
  Transition,
  Typography,
  UnstyledButton,
  UnstyledButtonProps,
  notifier,
} from "@tidbcloud/uikit";
import { useDisclosure } from "@tidbcloud/uikit/hooks";
import {
  IconBookClosed,
  IconBookmark,
  IconCheck,
  IconChevronRight,
  IconEdit03,
  IconHelpCircle,
  IconLayoutLeft,
  IconLinkExternal01,
  IconMenu01,
  IconMessageTextSquare02,
  IconPlus,
  IconTrash01,
  IconUserCircle,
  IconXClose,
} from "@tidbcloud/uikit/icons";
import { useMemoizedFn } from "ahooks";
import {
  MouseEvent,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { match } from "ts-pattern";

import { actions, useAppDispatch, useAppSelector } from "~/store";
import { useLargeScreen } from "~/utils/useLargeScreen";

import { selectSessionById } from "~/store/selector";
import { trpcNextClient } from "~/utils/trpc.next";
import { AboutUs } from "./AboutUs";
import { FAQ } from "./FAQ";
import { Feedback } from "./FeedBack";

function NavButton({
  children,
  icon,
  onClick,
  withBorder = false,
  ...rest
}: {
  children: ReactNode;
  icon?: ReactNode;
  onClick?: () => void;
  withBorder?: boolean;
} & UnstyledButtonProps) {
  return (
    <UnstyledButton
      onClick={onClick}
      {...rest}
      sx={(theme) => ({
        fontSize: 14,
        padding: "12px 16px",
        borderBottom: withBorder
          ? `1px solid ${theme.colors.gray[1]}`
          : undefined,
        "&:hover": {
          backgroundColor: theme.colors.gray[2],
        },
      })}
    >
      <Group>
        {icon}
        {children}
      </Group>
    </UnstyledButton>
  );
}

interface ConversationProps {
  id: string;
  onClick?: () => void;
}

function ConversationItem({ id, onClick }: ConversationProps) {
  const dispatch = useAppDispatch();
  const currentConversationId = useAppSelector(
    (s) => s.session.currentConversationId,
  );
  const convo = useAppSelector((s) => selectSessionById(s, id));
  const { name } = convo;
  const isCurrent = currentConversationId === id;
  const inputRef = useRef<HTMLInputElement>(null);
  const [nameValue, setNameValue] = useState(name);
  const [mode, setMode] = useState<"normal" | "edit" | "delete">("normal");
  const [deleting, setDeleting] = useState(false);
  const [renaming, setRenaming] = useState(false);

  const deleteConvo = trpcNextClient.deleteConversation.useMutation();
  const renameConvo = trpcNextClient.renameConversation.useMutation();

  const handleClick = useMemoizedFn(() => {
    dispatch(actions.session.switchConversation(id));
    onClick?.();
  });

  const handleDelete = useMemoizedFn(async (e: MouseEvent) => {
    e.stopPropagation();
    if (deleting) return;
    try {
      setDeleting(true);
      await deleteConvo.mutateAsync({ id });
      dispatch(actions.session.deleteSession(id));
      setMode("normal");
    } catch (e) {
      if (e instanceof Error) {
        notifier.error(e.message);
      }
    } finally {
      setDeleting(false);
    }
  });

  const handleEdit = useMemoizedFn(async (e: MouseEvent) => {
    e.stopPropagation();
    if (renaming) return;
    try {
      setRenaming(true);
      await renameConvo.mutateAsync({ id, name: nameValue });
      dispatch(actions.session.updateConversation({ id, name: nameValue }));
      setMode("normal");
    } catch (e) {
      if (e instanceof Error) {
        notifier.error(e.message);
      }
    } finally {
      setRenaming(false);
    }
  });

  useEffect(() => {
    if (mode === "edit") {
      inputRef.current?.focus();
    }
  }, [mode]);

  return (
    <Box
      onClick={handleClick}
      data-id={id}
      sx={{
        cursor: "pointer",
        paddingLeft: 8,
        paddingRight: 8,
        marginBottom: 4,
      }}
    >
      <Group
        position="apart"
        noWrap
        sx={(theme) => ({
          padding: 8,
          paddingLeft: 16,
          borderRadius: 8,
          backgroundColor: isCurrent ? theme.colors.gray[2] : undefined,
          transitionDuration: ".3s",
          "&:hover": {
            backgroundColor: theme.colors.gray[2],

            "& .actions": {
              visibility: "visible",
            },
          },
        })}
      >
        <Group spacing={8} noWrap>
          {match(mode)
            .with("normal", () => (
              <>
                <IconMessageTextSquare02 size={14} />
                <Typography
                  variant="label-md"
                  lineClamp={1}
                  title={name}
                  sx={{ wordBreak: "break-all" }}
                >
                  {name}
                </Typography>
              </>
            ))
            .with("edit", () => (
              <Input
                ref={inputRef}
                size="xs"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
              />
            ))
            .with("delete", () => (
              <Typography variant="label-md">Confirm delete?</Typography>
            ))
            .exhaustive()}
        </Group>

        {match(mode)
          .with("normal", () => (
            <Group
              spacing={0}
              className="actions"
              sx={{ visibility: "hidden" }}
              noWrap
            >
              <ActionIcon
                variant="transparent"
                onClick={(e) => {
                  e.stopPropagation();
                  setMode("edit");
                }}
              >
                <IconEdit03 size={14} />
              </ActionIcon>

              <ActionIcon
                variant="transparent"
                onClick={(e) => {
                  e.stopPropagation();
                  setMode("delete");
                }}
              >
                <IconTrash01 size={14} />
              </ActionIcon>
            </Group>
          ))
          .with("edit", () => (
            <Group spacing={0} noWrap>
              <ActionIcon variant="transparent" onClick={handleEdit}>
                {renaming ? <Loader size="xs" /> : <IconCheck size={14} />}
              </ActionIcon>

              <ActionIcon
                variant="transparent"
                onClick={(e) => {
                  e.stopPropagation();
                  setMode("normal");
                }}
              >
                <IconXClose size={14} />
              </ActionIcon>
            </Group>
          ))
          .with("delete", () => (
            <Group spacing={0} noWrap>
              <ActionIcon variant="transparent" onClick={handleDelete}>
                {deleting ? <Loader size="xs" /> : <IconCheck size={14} />}
              </ActionIcon>

              <ActionIcon
                variant="transparent"
                onClick={(e) => {
                  e.stopPropagation();
                  setMode("normal");
                }}
              >
                <IconXClose size={14} />
              </ActionIcon>
            </Group>
          ))
          .exhaustive()}
      </Group>
    </Box>
  );
}

export function Sidepanel() {
  const largeScreen = useLargeScreen();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.account.user);
  const list = useAppSelector((s) => s.session.list);
  const [creatingNewChat, setCreatingNewChat] = useState(false);
  const [sidepanelOpened, sidepanelOpenedHandlers] = useDisclosure();
  const [faqOpened, faqOpenedHandlers] = useDisclosure();
  const [feedbackOpened, feedbackOpenedHandlers] = useDisclosure();
  const [aboutUsOpened, aboutUsOpenedHandlers] = useDisclosure();
  const [open, setOpen] = useState(true);
  const width = useMemo(() => {
    if (largeScreen) {
      return open ? 260 : 0;
    } else {
      return open ? "100%" : 0;
    }
  }, [largeScreen, open]);

  const panelContent = (
    <Stack
      w={width}
      sx={(theme) => ({
        flexShrink: 0,
        borderRight: largeScreen
          ? `1px solid ${theme.colors.gray[2]}`
          : undefined,
        transition: "width .2s",
        overflow: "hidden",
      })}
      h="100%"
      spacing={0}
    >
      <Affix position={{ top: 6, left: 6 }}>
        <Transition transition="slide-right" mounted={!open}>
          {(transitionStyles) => (
            <ActionIcon
              variant="light"
              onClick={() => setOpen((o) => !o)}
              style={transitionStyles}
              radius="lg"
              size={30}
              color="blue"
            >
              <IconChevronRight size={20} />
            </ActionIcon>
          )}
        </Transition>
      </Affix>

      <Group pl={20} py={8} spacing={8}>
        <Typography variant="headline-md">TiInsight</Typography>
        <Badge variant="outline">Experimental</Badge>
      </Group>

      <Group position="apart" px={16} py={8}>
        <Button
          size="xs"
          leftIcon={
            creatingNewChat ? <Loader size={18} /> : <IconPlus size={18} />
          }
          variant="default"
          style={{ flexGrow: 1 }}
          onClick={async () => {
            setCreatingNewChat(true);
            dispatch(actions.session.createNewConversation()).finally(() => {
              setCreatingNewChat(false);
            });
            sidepanelOpenedHandlers.close();
          }}
        >
          New Chat
        </Button>
        {largeScreen && (
          <Tooltip label="Close sidebar">
            <ActionIcon size="xs" onClick={() => setOpen((o) => !o)}>
              <IconLayoutLeft size={18} />
            </ActionIcon>
          </Tooltip>
        )}
      </Group>

      <ScrollArea sx={{ flexGrow: 1 }}>
        <Stack spacing={0}>
          {list.map((i) => (
            <ConversationItem
              id={i}
              key={i}
              onClick={sidepanelOpenedHandlers.close}
            />
          ))}
        </Stack>
      </ScrollArea>

      <Stack
        sx={(theme) => ({ borderTop: `1px solid ${theme.colors.gray[1]}` })}
        spacing={0}
        pb={20}
      >
        {user && (
          <NavButton
            icon={<IconUserCircle size={16} />}
            onClick={() => {
              dispatch(
                actions.session.openModal({
                  modal: "profile",
                  modalProps: {
                    title: "Profile",
                  },
                }),
              );
            }}
          >
            <b>{user.isGuest ? "Guest" : user.email.split("@").at(0)}</b>
          </NavButton>
        )}

        <NavButton
          icon={<IconBookmark size={16} />}
          onClick={() => {
            if (user?.isGuest) {
              dispatch(
                actions.session.openModal({
                  modal: "profile",
                  modalProps: {
                    title: "Profile",
                  },
                }),
              );
              return;
            }
            window.open("/bookmarks");
          }}
        >
          Bookmarks
        </NavButton>

        <NavButton
          icon={<Image src="/tidbcloud.svg" alt="" width={16} height={16} />}
          onClick={() => aboutUsOpenedHandlers.open()}
        >
          About us
        </NavButton>
        <NavButton
          icon={<IconHelpCircle size={16} />}
          onClick={() => faqOpenedHandlers.open()}
        >
          FAQ
        </NavButton>
        <NavButton
          icon={<IconLinkExternal01 size={16} />}
          onClick={() => {
            window.open("/doc.html", "_blank");
          }}
        >
          Open API
        </NavButton>
        <NavButton
          icon={<IconBookClosed size={16} />}
          onClick={() => feedbackOpenedHandlers.open()}
        >
          Feedback
        </NavButton>
      </Stack>

      <Modal
        title="FAQ"
        opened={faqOpened}
        onClose={faqOpenedHandlers.close}
        centered
      >
        <FAQ />
      </Modal>

      <Modal
        title="Feedback"
        opened={feedbackOpened}
        onClose={feedbackOpenedHandlers.close}
        centered
      >
        <Feedback />
      </Modal>

      <Modal
        title="About us"
        opened={aboutUsOpened}
        onClose={aboutUsOpenedHandlers.close}
        centered
      >
        <AboutUs />
      </Modal>
    </Stack>
  );

  if (!largeScreen) {
    return (
      <>
        <Center h={50} w="100%" sx={{ position: "relative" }}>
          <ActionIcon
            sx={{ position: "absolute", left: 16 }}
            onClick={() => sidepanelOpenedHandlers.open()}
          >
            <IconMenu01 />
          </ActionIcon>

          <Group ml={16} spacing={8}>
            <Typography variant="headline-md">TiInsight</Typography>
            <Badge variant="outline" size="xs">
              Experimental
            </Badge>
          </Group>
        </Center>

        <Drawer
          opened={sidepanelOpened}
          onClose={() => sidepanelOpenedHandlers.close()}
          size="80%"
          styles={{ header: { display: "none" }, body: { height: "100%" } }}
        >
          {panelContent}
        </Drawer>
      </>
    );
  }

  return panelContent;
}
