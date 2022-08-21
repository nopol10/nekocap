import { Popconfirm, Space, Table, Tooltip, Pagination, Tag } from "antd";
import React, { ReactNode, useState } from "react";
import { CaptionListFields } from "@/common/feature/video/types";
import DeleteOutlined from "@ant-design/icons/DeleteOutlined";
import EyeOutlined from "@ant-design/icons/EyeOutlined";
import EditOutlined from "@ant-design/icons/EditOutlined";
import { captionColumns } from "./data-columns";
import { CaptionerFields } from "@/common/feature/captioner/types";
import { ColumnsType } from "antd/lib/table/Table";
import { routeNames } from "../../route-types";
import styled from "styled-components";
import { colors } from "@/common/colors";
import { DEVICE } from "@/common/style-constants";
import { MobileCaptionList } from "../../home/components/mobile-caption-list";
import { PaginationProps } from "antd/lib/pagination";
import { useSSRMediaQuery } from "@/hooks";
import { UpdateCaptionModal } from "@/extension/content/containers/update-caption-modal";
import { i18n, useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import {
  getCaptionGroupTagColor,
  getCaptionGroupTagName,
} from "@/common/feature/video/utils";
import Text from "antd/lib/typography/Text";

export const CAPTION_LIST_PAGE_SIZE = 20;

const CaptionTable = styled(Table)`
  .rejected-caption {
    background-color: ${colors.lightDislike};
    &:hover > td.ant-table-cell {
      background-color: ${colors.lightDislike};
    }
  }
`;

type CaptionListProps = {
  captions: CaptionListFields[];
  captionerId?: string; // Which user this list of subs belong to
  captioner?: CaptionerFields; // More data about the owner of these subs
  totalCount: number;
  currentPage: number;
  loggedInUser?: CaptionerFields;
  isLoadingCaptionPage?: boolean;
  onChangePage?: (page: number, pageSize?: number) => void;
  onDelete?: (caption: CaptionListFields) => void;
  renderPagination?: (
    page: number,
    type: "page" | "prev" | "next" | "jump-prev" | "jump-next",
    originalElement: React.ReactElement<HTMLElement>
  ) => React.ReactNode;
  renderTotal?: (total: number, range: number[]) => string;
  onUpdateCaption?: (captionId: string) => void;
  onSelectTag?: (tag: string[]) => void;
  listContainsCurrentPageOnly?: boolean;
  hideActions?: boolean;
};

type UpdateModalDetails = {
  open: boolean;
  caption?: CaptionListFields;
};

export const CaptionList = ({
  captions,
  totalCount,
  captioner,
  captionerId,
  currentPage,
  onDelete,
  onChangePage,
  isLoadingCaptionPage,
  loggedInUser,
  renderPagination,
  renderTotal,
  onUpdateCaption,
  listContainsCurrentPageOnly = false,
  hideActions = false,
  onSelectTag,
}: CaptionListProps): React.ReactElement => {
  const isDesktop = useSSRMediaQuery({ query: DEVICE.desktop });
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState<
    UpdateModalDetails
  >({ open: false, caption: undefined });
  const { t } = useTranslation("common");
  const router = useRouter();

  const { isAdmin: isLoggedInUserAdmin, isReviewer: isLoggedInUserReviewer } =
    loggedInUser || {};
  const isOwner = loggedInUser ? loggedInUser.userId === captionerId : false;
  const canDelete = isLoggedInUserAdmin || isOwner;
  const canEdit = isLoggedInUserAdmin || isLoggedInUserReviewer;
  const canUpdate = isOwner || isLoggedInUserAdmin;

  const handleConfirmDelete = (caption: CaptionListFields) => {
    if (onDelete) {
      onDelete(caption);
    }
  };

  const handleClickReviewCaption = (caption: CaptionListFields) => {
    router.push(routeNames.caption.main.replace(":id", caption.id));
  };

  const handleClickUpdateCaption = (caption: CaptionListFields) => {
    setIsUpdateModalOpen({ open: true, caption });
  };

  const handleCancelUpdateCaptionModal = () => {
    setIsUpdateModalOpen({ open: false, caption: undefined });
  };

  const tableColumns: ColumnsType<CaptionListFields> = [
    captionColumns.videoName,
    isOwner || isLoggedInUserAdmin ? captionColumns.views : undefined,
    captionColumns.videoSource,
    !captionerId ? captionColumns.captioner : undefined,
    captionColumns.createdDate,
    captionColumns.videoLanguage,
    captionColumns.captionLanguage,
    captionColumns.updatedDate,
  ].filter(Boolean);

  if ((canEdit || canDelete) && !hideActions) {
    tableColumns.push({
      title: (): ReactNode => {
        return i18n.t("home.captionList.columns.actions");
      },
      key: "actions",
      render: function render(text, record, index) {
        return (
          <>
            <Space>
              {canDelete && (
                <Popconfirm
                  title={t("review.deleteCaptionConfirmMessage")}
                  onConfirm={() => handleConfirmDelete(record)}
                >
                  <Tooltip title={t("review.delete")}>
                    <DeleteOutlined />
                  </Tooltip>
                </Popconfirm>
              )}
              {canEdit && (
                <Tooltip title={t("review.review")}>
                  <EyeOutlined
                    onClick={() => handleClickReviewCaption(record)}
                  />
                </Tooltip>
              )}
              {canUpdate && (
                <Tooltip title={t("review.update")}>
                  <EditOutlined
                    onClick={() => handleClickUpdateCaption(record)}
                  />
                </Tooltip>
              )}
            </Space>
          </>
        );
      },
    });
  }

  const handleChangePage = (page: number, pageSize?: number) => {
    onChangePage(page, pageSize);
    window.scrollTo({
      behavior: "smooth",
      top: 0,
    });
  };

  const handleUpdatedCaption = (captionId: string) => {
    // Reload list
    onChangePage(currentPage, CAPTION_LIST_PAGE_SIZE);
    onUpdateCaption?.(captionId);
  };

  const defaultTotalRenderer = (total) => `${total} captions`;
  const paginationProps: PaginationProps = {
    pageSize: CAPTION_LIST_PAGE_SIZE,
    total: totalCount,
    showTotal: renderTotal || defaultTotalRenderer,
    onChange: handleChangePage,
    current: currentPage,
    showSizeChanger: false,
    itemRender: renderPagination,
  };

  if (!isDesktop) {
    return (
      <>
        <MobileCaptionList
          captions={
            listContainsCurrentPageOnly
              ? captions
              : captions.slice(
                  (currentPage - 1) * CAPTION_LIST_PAGE_SIZE,
                  currentPage * CAPTION_LIST_PAGE_SIZE
                )
          }
        />
        <Pagination {...paginationProps} />
      </>
    );
  }

  const renderExpandedRow = (record: CaptionListFields) => {
    return (
      <>
        <Text style={{ marginRight: "20px" }}>Tags:</Text>
        {record.tags
          ?.filter((tag) => !!getCaptionGroupTagName(tag))
          .map((tag) => {
            const tagName = getCaptionGroupTagName(tag);
            const tagColor = getCaptionGroupTagColor(tag);
            return (
              <Tag
                style={{ cursor: onSelectTag ? "pointer" : "unset" }}
                key={tag}
                color={tagColor}
                onClick={() => onSelectTag?.([tag])}
              >
                {tagName}
              </Tag>
            );
          })}
      </>
    );
  };

  const isRowExpandable = (record: CaptionListFields) => {
    return !!record.tags?.find((tag) => !!getCaptionGroupTagName(tag));
  };
  return (
    <>
      <CaptionTable
        columns={tableColumns}
        dataSource={captions}
        loading={isLoadingCaptionPage}
        rowKey={"id"}
        rowClassName={(record: CaptionListFields) => {
          return record?.rejected ? "rejected-caption" : "";
        }}
        pagination={paginationProps}
        expandable={{
          defaultExpandAllRows: true,
          expandIcon: () => null,
          expandedRowKeys: captions.map((caption) => caption.id),
          expandedRowRender: renderExpandedRow,
          rowExpandable: isRowExpandable,
        }}
        locale={{
          emptyText: t("home.noCaptions"),
        }}
      />
      <UpdateCaptionModal
        caption={isUpdateModalOpen.caption}
        visible={isUpdateModalOpen.open}
        onCancel={handleCancelUpdateCaptionModal}
        onUpdated={handleUpdatedCaption}
      />
    </>
  );
};
