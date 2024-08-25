import React, { ReactElement } from "react";
import { useTranslation } from "next-i18next";
import {
  Card,
  Col,
  ColProps,
  List,
  message,
  Popconfirm,
  Row,
  RowProps,
  Tooltip,
  Typography,
} from "antd";
import VirtualList from "rc-virtual-list";
import DeleteOutlined from "@ant-design/icons/DeleteOutlined";
import { WSCaptionTag } from "@/common/components/ws-caption-tag";
import {
  useDeleteProfileTagMutation,
  useGetOwnProfileTagsQuery,
} from "@/common/feature/profile/api";
import { getCaptionTagFromTagString } from "@/common/feature/video/utils";
import useBreakpoint from "antd/lib/grid/hooks/useBreakpoint";

const { Title, Text } = Typography;

const rowSettings: RowProps = {
  gutter: 16,
};

const tagColumnSettings: ColProps = {
  xs: { span: 8 },
};

const BORDER_STYLE = "1px solid #f3f3f3";

export const UserSettings = (): ReactElement => {
  const { t } = useTranslation("common");
  // TODO: Look into this later, deep type instantiation typescript issue
  // @ts-ignore
  const { data, isFetching: isFetchingTags } = useGetOwnProfileTagsQuery([]);
  const [deleteProfileTag, { isLoading: isDeletingTag }] =
    useDeleteProfileTagMutation();

  const breakpoints = useBreakpoint();

  const handleConfirmDeleteTag = (tagString: string) => {
    const tag = getCaptionTagFromTagString(tagString);
    if (!tag) {
      message.error(t("settings.tags.invalidTag"));
      return;
    }
    deleteProfileTag([{ tagName: tag.name }]);
  };

  const sectionNameColumnSettings: ColProps = {
    xs: { span: 24 },
    md: { span: 3 },
    style: {
      ...(breakpoints.md
        ? { borderRight: BORDER_STYLE }
        : { borderBottom: BORDER_STYLE, paddingBottom: 16 }),
    },
  };

  const sectionContentColumnSettings: ColProps = {
    xs: { span: 24 },
    md: { span: 21 },
    style: {
      ...(breakpoints.md && { paddingLeft: 24 }),
    },
  };

  return (
    <Card>
      <Row {...rowSettings}>
        <Col>
          <Title>{t("settings.title")}</Title>
        </Col>
      </Row>
      <Row {...rowSettings}>
        <Col {...sectionNameColumnSettings}>
          <Title level={3}>{t("settings.tags.title")}</Title>
          <Text>{t("settings.tags.subtitle")}</Text>
        </Col>
        <Col {...sectionContentColumnSettings}>
          <List
            loading={isFetchingTags || isDeletingTag}
            style={{ maxWidth: 600 }}
          >
            <List.Item>
              <Row gutter={16} style={{ width: "100%" }}>
                <Col {...tagColumnSettings}>{t("settings.tags.tagName")}</Col>
                <Col {...tagColumnSettings}>{t("settings.tags.captions")}</Col>
                <Col {...tagColumnSettings}>
                  {t("home.captionList.columns.actions")}
                </Col>
              </Row>
            </List.Item>
            <VirtualList
              data={data?.tags || []}
              height={320}
              itemHeight={60}
              itemKey={"tag"}
            >
              {(tag: { tag: string; count: number }, index: number) => {
                return (
                  <List.Item key={`${tag}-${index}`}>
                    <Row gutter={16} style={{ width: "100%" }}>
                      <Col {...tagColumnSettings}>
                        <WSCaptionTag tag={tag.tag}></WSCaptionTag>
                      </Col>
                      <Col {...tagColumnSettings}>{tag.count}</Col>
                      <Col {...tagColumnSettings}>
                        <Popconfirm
                          title={t("settings.deleteTagConfirmMessage")}
                          onConfirm={() => handleConfirmDeleteTag(tag.tag)}
                        >
                          <Tooltip title={t("review.delete")}>
                            <DeleteOutlined />
                          </Tooltip>
                        </Popconfirm>
                      </Col>
                    </Row>
                  </List.Item>
                );
              }}
            </VirtualList>
          </List>
        </Col>
      </Row>
    </Card>
  );
};
