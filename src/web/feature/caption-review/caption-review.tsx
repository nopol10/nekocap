import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { colors } from "@/common/colors";
import { WSLayout } from "@/common/components/ws-layout";
import Layout from "antd/lib/layout";
import {
  Button,
  Input,
  message,
  Skeleton,
  Tooltip,
  Typography,
  Table,
  Form,
  Space,
  Popconfirm,
} from "antd";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Controller, useForm } from "react-hook-form";
import {
  loadCaptionForReview,
  rejectCaption,
  verifyCaption,
} from "@/common/feature/caption-review/actions";
import { captionReviewSelector } from "@/common/feature/caption-review/selectors";
import { captionDataColumns } from "./caption-columns";
import CloseSquareOutlined from "@ant-design/icons/CloseSquareOutlined";
import CheckSquareOutlined from "@ant-design/icons/CheckSquareOutlined";
import { languages } from "@/common/languages";
import Modal, { ModalProps } from "antd/lib/modal/Modal";
import { getTooltippedDate } from "../common/components/data-columns";
import {
  ReviewActionDetails,
  ReviewStatus,
} from "@/common/feature/caption-review/types";
import { routeNames } from "../route-types";
import { Link as RouterLink } from "react-router-dom";
import { videoSourceToProcessorMap } from "@/common/feature/video/utils";
import { NekoCaption } from "@/common/caption-parsers/types";
import { getCaptionCues } from "@/common/caption-utils";

const { Title, Link, Paragraph } = Typography;
const { Content, Sider } = Layout;

const CaptionContent = styled(Table)``;

const CaptionerSider = styled(Sider)`
  &.ant-layout-sider {
    padding: 0 20px 20px;
  }
`;

type RejectForm = {
  reason: string;
};

const getReviewStatusLabel = (status: ReviewStatus) => {
  switch (status) {
    case "rejected":
      return "Rejected";
    case "unrejected":
      return "Unrejected";
    case "verified":
      return "Verified";
    case "unverified":
    default:
      return "Unverified";
  }
};

const getRejectActionLabel = (rejected) => (rejected ? "Unreject" : "Reject");

const getVerifyActionLabel = (verified) => (verified ? "Unverify" : "Verify");
const getVerifyStatusLabel = (verified) =>
  verified ? "Verified" : "Unverified";

const ReviewModal = ({
  onSubmit,
  actionLabel,
  ...rest
}: {
  onSubmit: (form: RejectForm) => void;
  actionLabel: string;
} & ModalProps) => {
  const { handleSubmit, control } = useForm<RejectForm>();

  return (
    <Modal
      {...rest}
      title={actionLabel}
      onOk={handleSubmit(onSubmit)}
      okText={actionLabel}
    >
      <Form>
        <Form.Item label={"Reason"}>
          <Controller
            name={"reason"}
            as={Input}
            control={control}
            defaultValue={""}
            placeholder={"Keep to 100 characters!"}
            required={true}
            rules={{
              required: true,
              maxLength: 100,
            }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

const rejectionColumns = [
  {
    title: (
      <>
        Rejector /<br />
        Approver
      </>
    ),
    dataIndex: "reviewerName",
    key: "reviewerName",
    render: function render(text, record: ReviewActionDetails, index) {
      return (
        <RouterLink
          to={{
            pathname: `${routeNames.profile.main.replace(
              ":id",
              record.reviewerId
            )}`,
          }}
        >
          {text}
        </RouterLink>
      );
    },
  },
  {
    title: "Date",
    dataIndex: "date",
    key: "date",
    render: (text, record, index) => {
      return getTooltippedDate(text);
    },
  },
  {
    title: "Reason",
    dataIndex: "reason",
    key: "reason",
    render: function render(text, record: ReviewActionDetails, index) {
      return (
        <>
          <div>
            <b>{getReviewStatusLabel(record.newState)}</b>
          </div>
          <div>{record.reason}</div>
        </>
      );
    },
  },
];

export const CaptionReview = () => {
  const { id: captionId } = useParams<{ id: string }>();
  const dispatch = useDispatch();
  const isLoadingCaption = useSelector(loadCaptionForReview.isLoading(null));
  const isRejecting = useSelector(rejectCaption.isLoading(null));
  const isUnverifying = useSelector(verifyCaption.isLoading(null));
  const review = useSelector(captionReviewSelector);
  const [showReject, setShowReject] = useState(false);
  const [showUnverify, setShowUnverify] = useState(false);

  useEffect(() => {
    dispatch(loadCaptionForReview.request(captionId));
  }, [captionId]);

  const {
    caption,
    captioner,
    videoName,
    reviewHistory,
    rejected,
    verified,
  } = review;

  const sortedRejectionHistory = useMemo(() => {
    if (!reviewHistory) {
      return [];
    }
    return [...reviewHistory].sort((h1, h2) => h2.date - h1.date);
  }, [reviewHistory]);

  const { data, languageCode, videoSource, videoId } = caption || {};

  const captionTextList: NekoCaption[] = useMemo(() => {
    return getCaptionCues(data);
  }, [data]);

  const { name } = captioner || {};
  const language: string = languages[languageCode] || "";

  const tableColumns = [
    captionDataColumns.startTime,
    captionDataColumns.captionText,
  ];

  const handleClickUnverify = () => {
    setShowUnverify(true);
  };
  const handleSubmitVerify = () => {
    dispatch(
      verifyCaption.request({
        captionId: captionId,
      })
    ).then(() => {
      message.success(verified ? "Caption unverified!" : "Caption verified!");
    });
  };

  const handleClickReject = () => {
    setShowReject(true);
  };

  const handleCancelRejectModal = () => {
    setShowReject(false);
  };

  const handleCancelVerifyModal = () => {
    setShowUnverify(false);
  };

  const handleSubmitRejection = (rejectForm: RejectForm) => {
    dispatch(
      rejectCaption.request({
        reason: rejectForm.reason,
        captionId,
      })
    ).then(() => {
      message.success(rejected ? "Caption unrejected!" : "Caption rejected!");
      setShowReject(false);
    });
  };

  const handleSubmitUnverify = (form: RejectForm) => {
    dispatch(
      verifyCaption.request({
        reason: form.reason,
        captionId,
      })
    ).then(() => {
      message.success(verified ? "Caption unverified!" : "Caption verified!");
      setShowUnverify(false);
    });
  };

  const renderRejectionTable = () => {
    return (
      <div>
        {sortedRejectionHistory && sortedRejectionHistory.length > 0 && (
          <Table
            dataSource={sortedRejectionHistory}
            columns={rejectionColumns}
            pagination={{ pageSize: 6 }}
          />
        )}
      </div>
    );
  };

  const renderVideoLink = () => {
    const processor = videoSourceToProcessorMap[videoSource];
    if (!processor) {
      return <b>videoName</b>;
    }
    return (
      <b>
        <Link
          href={processor.generateVideoLink(videoId)}
          target="_blank"
          rel="noreferrer"
        >
          {videoName}
        </Link>
      </b>
    );
  };

  return (
    <>
      <ReviewModal
        actionLabel={getRejectActionLabel(rejected)}
        visible={showReject}
        onCancel={handleCancelRejectModal}
        onSubmit={handleSubmitRejection}
        confirmLoading={isRejecting}
      />
      <ReviewModal
        actionLabel={getVerifyActionLabel(verified)}
        visible={showUnverify}
        onCancel={handleCancelVerifyModal}
        onSubmit={handleSubmitUnverify}
        confirmLoading={isUnverifying}
      />

      <WSLayout style={{ height: "100%" }}>
        <CaptionerSider width={"420px"}>
          <Skeleton loading={isLoadingCaption}>
            <Title>{name}</Title>
            <Paragraph>
              <b>{language}</b> caption for
            </Paragraph>
            <Paragraph>{renderVideoLink()}</Paragraph>
            <div>
              <Space>
                <Tooltip title={getVerifyActionLabel(verified)}>
                  <Popconfirm
                    title={"Verify this caption?"}
                    disabled={verified}
                    onConfirm={handleSubmitVerify}
                  >
                    <CheckSquareOutlined
                      style={{ fontSize: "2em", color: colors.like }}
                      onClick={verified ? handleClickUnverify : undefined}
                    />
                  </Popconfirm>
                </Tooltip>
                <Tooltip title={getRejectActionLabel(rejected)}>
                  <CloseSquareOutlined
                    style={{ fontSize: "2em", color: colors.dislike }}
                    onClick={handleClickReject}
                  />
                </Tooltip>
              </Space>
            </div>
            {renderRejectionTable()}
          </Skeleton>
        </CaptionerSider>
        {captionTextList && (
          <Content>
            <CaptionContent
              columns={tableColumns}
              dataSource={captionTextList}
              pagination={false}
              loading={isLoadingCaption}
              locale={{
                emptyText: "This caption does not contain any data...",
              }}
            ></CaptionContent>
          </Content>
        )}
      </WSLayout>
    </>
  );
};
