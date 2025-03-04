import googleLoginImage from "@/assets/images/google/btn_google_signin_light_normal_web@2x.png";
import { AuthButton } from "@/common/components/auth-button";
import { webLoginWithGoogle } from "@/common/feature/login/actions";
import { Modal, ModalFuncProps } from "antd";
import { useTranslation } from "next-i18next";
import { ReactElement } from "react";
import { useDispatch } from "react-redux";

type LoginModalProps = {
  modalProps: ModalFuncProps;
};

export const LoginModal = ({ modalProps }: LoginModalProps): ReactElement => {
  const dispatch = useDispatch();
  const { t } = useTranslation("common");

  const handleClickGoogleLogin = () => {
    dispatch(
      webLoginWithGoogle.request({ background: false, withCaptions: false }),
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
