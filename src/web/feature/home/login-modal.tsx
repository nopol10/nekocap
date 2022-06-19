import Modal, { ModalFuncProps } from "antd/lib/modal/Modal";
import React, { ReactElement } from "react";
import { useDispatch } from "react-redux";
import googleLoginImage from "@/assets/images/google/btn_google_signin_light_normal_web@2x.png";
import { webLoginWithGoogle } from "@/common/feature/login/actions";
import { AuthButton } from "@/common/components/auth-button";
import { useTranslation } from "next-i18next";

type LoginModalProps = {
  modalProps: ModalFuncProps;
};

export const LoginModal = ({ modalProps }: LoginModalProps): ReactElement => {
  const dispatch = useDispatch();
  const { t } = useTranslation("common");

  const handleClickGoogleLogin = () => {
    dispatch(
      webLoginWithGoogle.request({ background: false, withCaptions: false })
    );
  };

  return (
    <>
      <Modal {...modalProps} footer={null} title={t("login.loginModalTitle")}>
        <AuthButton
          src={googleLoginImage.src}
          onClick={handleClickGoogleLogin}
          href="#"
        />
      </Modal>
    </>
  );
};
