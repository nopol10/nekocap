import React, { useRef, useState } from "react";
import styled from "styled-components";
import { colors } from "@/common/colors";
import {
  Button,
  Input,
  List,
  Space,
  Spin,
  Row,
  Col,
  Popover,
  Card,
  Form,
  Affix,
  Select,
  Divider,
} from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
  searchSelector,
  searchVideoCaptionResultsSelector,
} from "@/common/feature/search/selectors";
import {
  loadSearchResultVideoCaptions,
  search,
} from "@/common/feature/search/actions";
import { InfiniteList } from "../common/components/infinite-table";
import { videoColumns } from "../common/components/data-columns";
import { VideoFields, VideoSource } from "@/common/feature/video/types";
import InfoCircleOutlined from "@ant-design/icons/InfoCircleOutlined";
import { languages } from "@/common/languages";
import { Controller, useForm } from "react-hook-form";
import SearchOutlined from "@ant-design/icons/SearchOutlined";
import Title from "antd/lib/typography/Title";
import { languageOptions } from "@/common/language-utils";
import { DEVICE } from "@/common/style-constants";
import emptyVideoImage from "@/assets/images/empty-video.jpg";
import { useOpenClose } from "@/hooks";
import { VideoCaptionModal } from "./video-caption-modal";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";

const PAGE_SIZE = 20;

const ResultsList = styled.div`
  .ant-list {
    background: ${colors.white};
  }
  .ant-row {
    padding: 20px;
  }
`;

const ResultCard = styled(Card)`
  &.ant-card {
  }
`;

const WRAPPER_TOP_DISTANCE = 20;

const Wrapper = styled.div`
  margin-top: ${WRAPPER_TOP_DISTANCE}px;
  padding: 0px 20px;
  overflow-x: hidden;
  height: calc(100vh - 64px - ${WRAPPER_TOP_DISTANCE}px);
  @media ${DEVICE.tablet} {
    padding: 0px 40px;
  }
`;

type SearchForm = {
  title: string;
  videoLanguageCode: string;
  captionLanguageCode: string;
};

const SearchForm = ({
  stickyTarget,
}: {
  stickyTarget?: () => HTMLElement | null;
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SearchForm>();
  const dispatch = useDispatch();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const isSearching = useSelector(search.isLoading(undefined));
  const router = useRouter();
  const { t } = useTranslation("common");

  const onSearch = (form: SearchForm) => {
    const url = new URL(
      `/search/${encodeURIComponent(form.title)}`,
      window.location.origin,
    );

    if (showAdvanced && form.videoLanguageCode) {
      url.searchParams.append("vl", form.videoLanguageCode);
    }
    if (showAdvanced && form.captionLanguageCode) {
      url.searchParams.append("cl", form.captionLanguageCode);
    }
    router.push(url.pathname + url.search);
    dispatch(
      search.request({
        title: form.title,
        videoLanguageCode: showAdvanced ? form.videoLanguageCode : "any",
        captionLanguageCode: showAdvanced ? form.captionLanguageCode : "any",
        pageNumber: 1,
        pageSize: PAGE_SIZE,
        append: false,
      }),
    );
  };

  const handleClickAdvanced = () => {
    setShowAdvanced(!showAdvanced);
  };

  return (
    <Affix offsetTop={0} target={stickyTarget}>
      <div style={{ marginBottom: "24px" }}>
        <Form
          onSubmitCapture={handleSubmit(onSearch)}
          style={{ background: colors.white, padding: "10px" }}
        >
          <Row gutter={[24, 6]}>
            <Col span={24} md={14}>
              <Form.Item
                validateStatus={errors.title ? "error" : undefined}
                style={{ margin: 0 }}
              >
                <Controller
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder={t("home.search.inputPlaceholder")}
                      style={{ fontSize: "20px" }}
                    />
                  )}
                  control={control}
                  name="title"
                  defaultValue={""}
                  rules={{
                    required: true,
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={24} md={6}>
              <Button
                onClick={handleClickAdvanced}
                style={{ width: "100%", height: "100%" }}
              >
                {t("home.search.advancedSearchLabel")}
              </Button>
            </Col>
            <Col span={24} md={4}>
              <Button
                style={{ width: "100%", height: "100%" }}
                htmlType={"submit"}
                disabled={isSearching}
              >
                <SearchOutlined style={{ fontSize: "20px" }} />
              </Button>
            </Col>
          </Row>
          {showAdvanced && (
            <>
              <Divider></Divider>
              <Row gutter={24}>
                <Col span={24} md={8}>
                  <Form.Item
                    label={t("home.search.videoLanguage")}
                    labelCol={{ xs: { span: 24, offset: 0 } }}
                    labelAlign={"left"}
                  >
                    <Controller
                      render={({ field }) => (
                        <Select
                          {...field}
                          showSearch
                          size={"large"}
                          style={{ fontSize: "20px", width: "100%" }}
                          filterOption={(input, option) =>
                            option.props.children
                              .toLowerCase()
                              .indexOf(input.toLowerCase()) >= 0 ||
                            option.props.value
                              .toLowerCase()
                              .indexOf(input.toLowerCase()) >= 0
                          }
                        >
                          <Select.Option key={"any"} value={"any"}>
                            {t("home.search.anyLanguage")}
                          </Select.Option>
                          {languageOptions}
                        </Select>
                      )}
                      name={"videoLanguageCode"}
                      control={control}
                      defaultValue={"any"}
                    ></Controller>
                  </Form.Item>
                </Col>
                <Col span={24} md={8}>
                  <Form.Item
                    label={t("home.search.captionLanguage")}
                    labelCol={{ xs: { span: 24, offset: 0 } }}
                    labelAlign={"left"}
                  >
                    <Controller
                      render={({ field }) => (
                        <Select
                          {...field}
                          showSearch
                          size={"large"}
                          style={{ fontSize: "20px", width: "100%" }}
                          filterOption={(input, option) =>
                            option.props.children
                              .toLowerCase()
                              .indexOf(input.toLowerCase()) >= 0 ||
                            option.props.value
                              .toLowerCase()
                              .indexOf(input.toLowerCase()) >= 0
                          }
                        >
                          <Select.Option key={"any"} value={"any"}>
                            {t("home.search.anyLanguage")}
                          </Select.Option>
                          {languageOptions}
                        </Select>
                      )}
                      name={"captionLanguageCode"}
                      control={control}
                      defaultValue={"any"}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}
        </Form>
      </div>
    </Affix>
  );
};

type SearchCaptionsProps = {
  title?: string;
};

export const SearchCaptions = ({
  title = "",
}: SearchCaptionsProps): JSX.Element => {
  const dispatch = useDispatch();
  const {
    currentResultPage,
    videos = [],
    hasMoreResults,
    captionLanguageCode,
    videoLanguageCode,
  } = useSelector(searchSelector);
  const isSearching = useSelector(search.isLoading(undefined));
  const videoCaptions = useSelector(searchVideoCaptionResultsSelector);
  const [isCaptionModalOpened, openCaptionModal, closeCaptionModal] =
    useOpenClose();
  const isLoadingCaptions = useSelector(
    loadSearchResultVideoCaptions.isLoading(undefined),
  );
  const [selectedVideo, setSelectedVideo] = useState<{
    videoId: string;
    videoSource: VideoSource;
  }>({ videoId: "", videoSource: VideoSource.Youtube });

  const resultContainer = useRef<HTMLDivElement>(null);
  const { t } = useTranslation("common");

  const handleChangeResultPage = (page: number, pageSize?: number) => {
    dispatch(
      search.request({
        title,
        videoLanguageCode: videoLanguageCode || undefined,
        captionLanguageCode: captionLanguageCode || undefined,
        pageNumber: page,
        pageSize: pageSize || PAGE_SIZE,
        append: true,
      }),
    );
  };

  const columns = [videoColumns.videoName, videoColumns.captionCount];

  const renderVideo = (video: VideoFields | "loading") => {
    if (video === "loading") {
      return (
        <List.Item key={"loader"}>
          <Card style={{ textAlign: "center" }}>
            <Space direction={"vertical"}>
              <Spin spinning={true} />
              <Title level={4}>{t("home.search.loading")}</Title>
            </Space>
          </Card>
        </List.Item>
      );
    }
    const { name, captionCount, captions, sourceId, source, thumbnailUrl } =
      video;
    const languageList = Object.keys(captions || []).filter(
      (language) => captions[language] > 0,
    );

    const handleClickVideo = () => {
      const videoSource = parseInt(source);
      dispatch(
        loadSearchResultVideoCaptions.request({
          videoId: video.sourceId,
          videoSource,
        }),
      );
      setSelectedVideo({ videoId: video.sourceId, videoSource });
      openCaptionModal();
    };
    return (
      <List.Item key={sourceId}>
        <ResultCard title={name}>
          <Space direction={"vertical"} style={{ width: "100%" }}>
            <div onClick={handleClickVideo}>
              <img
                style={{ width: "100%" }}
                src={thumbnailUrl || emptyVideoImage.src}
              />
            </div>
            <div>
              <Popover
                title={t("home.search.captionLanguageListTitle")}
                content={
                  <ul>
                    {languageList.map((language) => {
                      return (
                        <li key={language}>
                          {languages[language]} - {captions[language]}
                        </li>
                      );
                    })}
                  </ul>
                }
              >
                <b>
                  {t("home.search.captionCount", {
                    captionCount: captionCount?.toString() || "?",
                  })}
                  &nbsp;&nbsp;
                  <InfoCircleOutlined style={{ verticalAlign: "middle" }} />
                </b>
              </Popover>
            </div>
          </Space>
        </ResultCard>
      </List.Item>
    );
  };

  const videosInList: (VideoFields | "loading")[] = [...videos];
  if (isSearching) {
    videosInList.push("loading");
  }

  return (
    <Wrapper ref={resultContainer}>
      <SearchForm stickyTarget={() => resultContainer.current} />
      <ResultsList>
        <InfiniteList
          hasMore={hasMoreResults}
          pageSize={PAGE_SIZE}
          data={videosInList}
          currentPage={currentResultPage}
          onChangePage={handleChangeResultPage}
          columns={columns}
          renderItem={renderVideo}
          listNode={List}
          pageStart={1}
          initialLoad={true}
          getScrollParent={() => resultContainer.current}
          listProps={{
            grid: {
              gutter: 20,
              xs: 1,
              sm: 2,
              md: 3,
              lg: 4,
              xl: 4,
              xxl: 4,
            },
            locale: {
              emptyText: t("home.search.noVideosFound"),
            },
          }}
        />
      </ResultsList>
      <VideoCaptionModal
        videoId={selectedVideo.videoId}
        videoSource={selectedVideo.videoSource}
        visible={isCaptionModalOpened}
        isLoading={isLoadingCaptions}
        onCancel={closeCaptionModal}
        captions={videoCaptions}
      ></VideoCaptionModal>
    </Wrapper>
  );
};
