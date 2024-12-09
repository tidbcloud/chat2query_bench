import { Modal } from "@tidbcloud/uikit";
import { useMemoizedFn } from "ahooks";
import { match } from "ts-pattern";

import { actions, useAppDispatch, useAppSelector } from "~/store";

import { PublicLinkCreated } from "./PublicLinkCreated";
import { ShareConversation } from "./ShareConversation";
import { Signup } from "./Signup";

export function GlobalModal() {
  const dispatch = useAppDispatch();
  const modal = useAppSelector((s) => s.session.modal);
  const modalProps = useAppSelector((s) => s.session.modalProps);
  const onClose = useMemoizedFn(() => {
    dispatch(actions.session.closeModal());
  });

  return (
    <Modal
      opened={modal !== "none"}
      onClose={onClose}
      title={modalProps?.title}
      centered
      overlayBlur={0}
      overlayOpacity={0.6}
    >
      {match(modal)
        .with("share", () => <ShareConversation {...modalProps} />)
        .with("shareCreated", () => <PublicLinkCreated {...modalProps} />)
        .with("profile", () => <Signup {...modalProps} />)
        .otherwise(() => null)}
    </Modal>
  );
}
