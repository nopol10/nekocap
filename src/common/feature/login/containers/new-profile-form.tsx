import { Button, Input, Typography } from "antd";
import Form from "antd/lib/form";
import Select from "antd/lib/select";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { useSelector, useDispatch } from "react-redux";
import { userDataSelector } from "@/common/feature/login/selectors";
import { updateCaptionerProfile } from "@/common/feature/captioner/actions";
import { captionerSelector } from "@/common/feature/captioner/selectors";
import { languageOptions } from "@/common/language-utils";
import styled from "styled-components";
import TextArea from "antd/lib/input/TextArea";
import { DISCORD_INVITE_URL } from "@/common/constants";
const { Title, Text, Link } = Typography;

const Page = styled.div``;

type FormType = {
  name: string;
  donationLink: string;
  profileMessage: string;
  languageCodes: string[];
};

const profileMessageLabel = (
  <div>
    <Text>Profile Message</Text>
    <br />
    <Text style={{ fontSize: "0.85em", whiteSpace: "break-spaces" }}>
      (Formatting in{" "}
      <Link href="https://www.markdownguide.org/cheat-sheet/" target="_blank">
        Markdown
      </Link>{" "}
      is supported)
    </Text>
  </div>
);

type NewProfileFormProps = {
  onSubmitSuccess: () => void;
};

export const NewProfileForm = ({ onSubmitSuccess }: NewProfileFormProps) => {
  const dispatch = useDispatch();
  const userData = useSelector(userDataSelector);
  const captioner = useSelector(captionerSelector);
  if (!userData) {
    return null;
  }
  const { languageCodes, name, profileMessage, donationLink } =
    captioner.captioner || {};
  const { handleSubmit, errors, control } = useForm<FormType>();

  const onSubmit = (data: FormType) => {
    if (!data.languageCodes || data.languageCodes.length <= 0) {
      return;
    }
    const { languageCodes, name, profileMessage, donationLink } = data;
    dispatch(
      updateCaptionerProfile.request({
        name,
        languageCodes,
        profileMessage,
        donationLink,
      })
    ).then(() => {
      onSubmitSuccess();
    });
  };

  const labelSpan = { md: 10 };

  return (
    <Page>
      <Title level={3}>Welcome to NekoCap!</Title>
      <Title level={4}>
        Fill in some basic information before we get started!
      </Title>
      <Title level={5} style={{ marginBottom: "20px" }}>
        Don't worry, you can edit these later (apart from your display name)
      </Title>
      <Form onFinish={handleSubmit(onSubmit)}>
        <Form.Item label="Display name" labelCol={labelSpan}>
          <Controller
            as={Input}
            name={"name"}
            control={control}
            required={true}
            defaultValue={name}
            rules={{ required: true }}
          ></Controller>
        </Form.Item>
        <Title level={5}>
          We do not collect emails so please join the NekoCap Discord{" "}
          <a href={DISCORD_INVITE_URL} target="_blank">
            here
          </a>{" "}
          to get the latest news and updates.
        </Title>
        <Form.Item
          label="Proficient languages"
          validateStatus={errors.languageCodes ? "error" : "success"}
          labelCol={labelSpan}
        >
          <Controller
            as={Select}
            name={"languageCodes"}
            control={control}
            mode={"multiple"}
            showSearch
            size={"large"}
            placeholder={"You can select more than 1!"}
            defaultValue={languageCodes}
            filterOption={(input, option) =>
              option.props.children
                .toLowerCase()
                .indexOf(input.toLowerCase()) >= 0 ||
              option.props.value.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
            rules={{ required: true, minLength: 1 }}
          >
            {languageOptions}
          </Controller>
        </Form.Item>
        <Form.Item label={profileMessageLabel} labelCol={labelSpan}>
          <Controller
            name={"profileMessage"}
            as={TextArea}
            control={control}
            defaultValue={profileMessage}
            style={{ height: "300px" }}
          />
        </Form.Item>
        <Form.Item
          label="Donation link (Patreon, Ko-fi etc)"
          labelCol={labelSpan}
        >
          <Controller
            as={Input}
            name={"donationLink"}
            control={control}
            defaultValue={donationLink}
            rules={{ required: false }}
          ></Controller>
        </Form.Item>
        <Form.Item style={{ textAlign: "right" }}>
          <Button type="primary" htmlType="submit">
            Submit
          </Button>
        </Form.Item>
      </Form>
    </Page>
  );
};
