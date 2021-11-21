import Modal, { ModalFuncProps } from "antd/lib/modal/Modal";
import React from "react";
import { useDispatch } from "react-redux";
import googleLoginImage from "@/assets/images/google/btn_google_signin_light_normal_web@2x.png";
import { webLoginWithGoogle } from "@/common/feature/login/actions";
import { AuthButton } from "@/common/components/auth-button";

type LoginModalProps = {
  modalProps: ModalFuncProps;
};

export const LoginModal = ({ modalProps }: LoginModalProps) => {
  const dispatch = useDispatch();
  const handleClickGoogleLogin = () => {
    dispatch(webLoginWithGoogle.request({ background: false }));
  };

  return (
    <>
      <Modal
        {...modalProps}
        footer={null}
        title={"Sign in to access your dashboard"}
      >
        <AuthButton
          src={googleLoginImage.src}
          onClick={handleClickGoogleLogin}
          href="#"
        />
      </Modal>
    </>
  );
};
