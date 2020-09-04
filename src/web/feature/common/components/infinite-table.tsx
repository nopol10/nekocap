import React, { ReactNode } from "react";
import { ColumnsType } from "antd/lib/table/Table";
import InfiniteScroll from "react-infinite-scroller";
import { ListProps } from "antd/lib/list";

type InfiniteTableProps<T> = {
  isLoading: boolean;
  data: T[];
  columns: ColumnsType<T>;
  captionerId?: string; // Which user this list of subs belong to
  currentPage: number;
  pageSize: number;
  hasMore: boolean;
  renderItem: (item: T) => ReactNode;
  onChangePage?: (page: number, pageSize?: number) => void;
  listNode: (props: ListProps<T>) => JSX.Element;
  listProps: ListProps<T>;
  getScrollParent?: () => HTMLElement;
  initialLoad?: boolean;
  pageStart?: number;
};

export const InfiniteList = <T,>({
  isLoading,
  data,
  columns,
  captionerId,
  pageSize,
  hasMore,
  onChangePage,
  renderItem,
  listNode: ListNode,
  getScrollParent,
  listProps,
  initialLoad = true,
  pageStart = 0,
}: InfiniteTableProps<T>) => {
  const handleFetch = (page: number) => {
    onChangePage(page, pageSize);
  };

  return (
    <InfiniteScroll
      loadMore={handleFetch}
      hasMore={hasMore}
      useWindow={false}
      getScrollParent={getScrollParent}
      initialLoad={initialLoad}
      pageStart={pageStart}
    >
      <ListNode dataSource={data} renderItem={renderItem} {...listProps} />
    </InfiniteScroll>
  );
};
