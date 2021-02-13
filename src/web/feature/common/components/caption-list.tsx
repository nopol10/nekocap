import { Popconfirm, Space, Table, Tooltip } from "antd";
import React from "react";
import { CaptionListFields } from "@/common/feature/video/types";
import DeleteOutlined from "@ant-design/icons/DeleteOutlined";
import EyeOutlined from "@ant-design/icons/EyeOutlined";
import { captionColumns } from "./data-columns";
import { CaptionerFields } from "@/common/feature/captioner/types";
import { ColumnsType } from "antd/lib/table/Table";
import { routeNames } from "../../route-types";
import { webHistory } from "../../web-history";
import styled from "styled-components";
import { colors } from "@/common/colors";

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
}: CaptionListProps) => {
  const { isAdmin: isLoggedInUserAdmin, isReviewer: isLoggedInUserReviewer } =
    loggedInUser || {};
  const isOwner = loggedInUser ? loggedInUser.userId === captionerId : false;
  const canDelete = isLoggedInUserAdmin || isOwner;
  const canEdit = isLoggedInUserAdmin || isLoggedInUserReviewer;
  const handleConfirmDelete = (caption: CaptionListFields) => {
    if (onDelete) {
      onDelete(caption);
    }
  };

  const handleClickEditCaption = (caption: CaptionListFields) => {
    webHistory.push(routeNames.caption.main.replace(":id", caption.id));
  };

  const tableColumns: ColumnsType<CaptionListFields> = [
    captionColumns.videoName,
    captionColumns.videoSource,
    !captionerId ? captionColumns.captioner : undefined,
    captionColumns.createdDate,
    captionColumns.videoLanguage,
    captionColumns.captionLanguage,
    captionColumns.updatedDate,
  ].filter(Boolean);

  if (canEdit || canDelete) {
    tableColumns.push({
      title: "Actions",
      key: "actions",
      render: function render(text, record, index) {
        return (
          <>
            <Space>
              {canDelete && (
                <Popconfirm
                  title={"Are you sure you want to delete this caption?"}
                  onConfirm={() => handleConfirmDelete(record)}
                >
                  <Tooltip title="Delete">
                    <DeleteOutlined />
                  </Tooltip>
                </Popconfirm>
              )}
              {canEdit && (
                <Tooltip title="Review">
                  <EyeOutlined onClick={() => handleClickEditCaption(record)} />
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
  };
  const defaultTotalRenderer = (total) => `${total} captions`;

  return (
    <CaptionTable
      columns={tableColumns}
      dataSource={captions}
      loading={isLoadingCaptionPage}
      rowClassName={(
        record: CaptionListFields,
        index: number,
        indent: number
      ) => {
        return record.rejected ? "rejected-caption" : "";
      }}
      pagination={{
        pageSize: 20,
        total: totalCount,
        showTotal: renderTotal || defaultTotalRenderer,
        onChange: handleChangePage,
        current: currentPage,
        showSizeChanger: false,
        itemRender: renderPagination,
      }}
      locale={{
        emptyText:
          "No captions! Visit YouTube or other supported sites to start uploading/creating your captions!",
      }}
    />
  );
};
