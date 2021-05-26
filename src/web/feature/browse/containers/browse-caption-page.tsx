import React, { useRef } from "react";
import { Typography } from "antd";
import styled from "styled-components";
import { colors } from "@/common/colors";
import { useDispatch, useSelector } from "react-redux";
import { search } from "@/common/feature/search/actions";
import { captionerSelector } from "@/common/feature/captioner/selectors";
import { CaptionListFields } from "@/common/feature/video/types";
import { publicDashboardSelector } from "@/common/feature/public-dashboard/selectors";
import { loadAllCaptions } from "@/common/feature/public-dashboard/actions";
import { CaptionList } from "../../common/components/caption-list";

const { Title } = Typography;
const PAGE_SIZE = 20;

const ResultsList = styled.div`
  .ant-list {
    background: ${colors.white};
  }
  .ant-row {
    padding: 20px;
  }
`;

export const BrowseCaptionPage = () => {
  const dispatch = useDispatch();
  const {
    currentResultPage,
    browseResults = [],
    hasMoreResults,
  } = useSelector(publicDashboardSelector);
  const captionerState = useSelector(captionerSelector);

  const isSearching = useSelector(search.isLoading(null));
  const isLoading = useSelector(loadAllCaptions.isLoading(null));
  const resultContainer = useRef<HTMLDivElement>(null);

  const { captioner: loggedInUserPublicProfile } = captionerState;
  // Add one to the caption count if more results are available
  const totalCaptionCount = browseResults.length + (hasMoreResults ? 1 : 0);
  const totalPages = Math.ceil(totalCaptionCount / PAGE_SIZE);

  const handleChangeResultPage = (page: number, pageSize?: number) => {
    dispatch(
      loadAllCaptions.request({
        pageNumber: page,
        pageSize: pageSize,
        append: true,
      })
    );
  };

  const captionsInList: (CaptionListFields | "loading")[] = [...browseResults];
  if (isSearching) {
    captionsInList.push("loading");
  }

  const renderPaginationItem = (
    page: number,
    type: "page" | "prev" | "next" | "jump-prev" | "jump-next",
    originalElement: React.ReactElement<HTMLElement>
  ) => {
    if (type !== "page") {
      return originalElement;
    }
    if (page === totalPages && hasMoreResults)
      return <a rel="nofollow">More</a>;
    return originalElement;
  };

  const renderTotal = (total: number): string => {
    if (hasMoreResults) return `> ${total - 1} captions`;
    return `${total} captions`;
  };

  return (
    <div
      style={{ marginTop: "40px", padding: "0px 40px", overflowX: "hidden" }}
      ref={resultContainer}
    >
      <Title>Browse all captions</Title>
      <ResultsList>
        <CaptionList
          loggedInUser={loggedInUserPublicProfile}
          captions={browseResults}
          totalCount={browseResults.length + (hasMoreResults ? 1 : 0)}
          isLoadingCaptionPage={isLoading}
          currentPage={currentResultPage}
          onChangePage={handleChangeResultPage}
          renderPagination={renderPaginationItem}
          renderTotal={renderTotal}
        />
      </ResultsList>
    </div>
  );
};
