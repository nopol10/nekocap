import React, { useRef, useState } from "react";
import { Typography } from "antd";
import styled from "styled-components";
import { colors } from "@/common/colors";
import { useSelector } from "react-redux";
import { search } from "@/common/feature/search/actions";
import { captionerSelector } from "@/common/feature/captioner/selectors";
import { CaptionListFields } from "@/common/feature/video/types";
import { publicDashboardSelector } from "@/common/feature/public-dashboard/selectors";
import { CaptionList } from "../../common/components/caption-list";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";

const { Title } = Typography;
export const BROWSE_PAGE_SIZE = 20;

const ResultsList = styled.div`
  .ant-list {
    background: ${colors.white};
  }
  .ant-row {
    padding: 20px;
  }
`;

export const BrowseCaptionPage = () => {
  const {
    currentResultPage,
    browseResults = [],
    hasMoreResults,
    totalResults,
  } = useSelector(publicDashboardSelector);
  const captionerState = useSelector(captionerSelector);
  const [isLoading, setIsLoading] = useState(false);

  const isSearching = useSelector(search.isLoading(null));
  const resultContainer = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { t } = useTranslation("common");

  const { captioner: loggedInUserPublicProfile } = captionerState;
  // Add one to the caption count if more results are available
  const totalCaptionCount = totalResults + (hasMoreResults ? 1 : 0);
  const totalPages = Math.ceil(totalCaptionCount / BROWSE_PAGE_SIZE);

  const handleChangeResultPage = async (page: number) => {
    setIsLoading(true);
    await router.push(`${page}`, null, { shallow: false });
    setIsLoading(false);
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
      return <a rel="nofollow">{t("common.more")}</a>;
    return originalElement;
  };

  const renderTotal = (total: number): string => {
    if (hasMoreResults)
      return t("home.captionList.moreThanXCaptions", {
        captionCount: total - 1,
      });
    return t("home.captionList.totalCaptionCount", { captionCount: total });
  };

  return (
    <div
      style={{
        marginTop: "40px",
        marginBottom: "60px",
        padding: "0px 40px",
        overflowX: "hidden",
      }}
      ref={resultContainer}
    >
      <Title>{t("home.browseCaptions.title")}</Title>
      <ResultsList>
        <CaptionList
          loggedInUser={loggedInUserPublicProfile}
          captions={browseResults}
          // The following warning will occur:
          // "`dataSource` length is less than `pagination.total` but large than `pagination.pageSize`.
          // Please make sure your config correct data with async mode."
          // This is intentional to allow the "More" button to be rendered
          totalCount={totalResults + (hasMoreResults ? 1 : 0)}
          isLoadingCaptionPage={isLoading}
          currentPage={currentResultPage}
          onChangePage={handleChangeResultPage}
          renderPagination={renderPaginationItem}
          renderTotal={renderTotal}
          listContainsCurrentPageOnly={true}
        />
      </ResultsList>
    </div>
  );
};
