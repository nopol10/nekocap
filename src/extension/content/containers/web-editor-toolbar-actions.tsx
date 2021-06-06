import { WSButton } from "@/common/components/ws-button";
import { setShowSubmitModalOpen } from "@/common/feature/caption-editor/actions";
import { isLoggedInSelector } from "@/common/feature/login/selectors";
import { LoginModal } from "@/web/feature/home/login-modal";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";

type WebEditorToolbarActionsProps = {
  showLogin?: boolean;
  toggleLogin?: () => void;
};

export function WebEditorToolbarActions({
  showLogin,
  toggleLogin,
}: WebEditorToolbarActionsProps) {
  const isLoggedIn = useSelector(isLoggedInSelector);
  const { t } = useTranslation("common");
  const dispatch = useDispatch();
  const submitCaption = useCallback(() => {
    dispatch(setShowSubmitModalOpen({ tabId: globalThis.tabId, show: true }));
  }, [dispatch]);

  return (
    <ActionWrapper>
      <LoginModal
        modalProps={{ open: showLogin, onCancel: toggleLogin }}
        title={t("login.loginModalEditorTitle")}
        onClickLogin={toggleLogin}
      />
      {!isLoggedIn && (
        <WSButton type="primary" onClick={toggleLogin}>
          {t("login.action")}
        </WSButton>
      )}
      {isLoggedIn && (
        <WSButton type="primary" onClick={submitCaption}>
          {t("editor.submitCaption")}
        </WSButton>
      )}
    </ActionWrapper>
  );
}

const ActionWrapper = styled.div`
  margin-left: auto;
  display: flex;
  flex-direction: row;
`;
