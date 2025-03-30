import type { ListProps, TableColumnsType } from "antd";
import { ReactNode } from "react";
import InfiniteScroll from "react-infinite-scroller";

type InfiniteTableProps<T> = {
  data: T[];
  columns: TableColumnsType<T>;
  currentPage: number;
  pageSize: number;
  hasMore: boolean;
  renderItem: (item: T) => ReactNode;
  onChangePage?: (page: number, pageSize?: number) => void;
  listNode: (props: ListProps<T>) => JSX.Element;
  listProps: ListProps<T>;
  getScrollParent?: () => HTMLElement | null;
  initialLoad?: boolean;
  pageStart?: number;
};

export const InfiniteList = <T,>({
  data,
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
    onChangePage?.(page, pageSize);
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
