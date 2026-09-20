import { colors } from "@/common/colors";
import {
  AdvancedFilter,
  CaptionerFields,
  CaptionerPrivateFields,
} from "@/common/feature/captioner/types";
import { EditProfileFields } from "@/common/feature/profile/types";
import {
  MAX_CAPTION_TITLE_FILTER_LENGTH,
  MAX_SEARCH_TAG_LIMIT,
} from "@/common/feature/video/constants";
import { CaptionListFields } from "@/common/feature/video/types";
import {
  getCaptionGroupTagName,
  getCaptionTagFromTagString,
} from "@/common/feature/video/utils";
import { DEVICE } from "@/common/style-constants";
import { useIsClient } from "@/hooks";
import CopyOutlined from "@ant-design/icons/CopyOutlined";
import EditOutlined from "@ant-design/icons/EditOutlined";
import SearchOutlined from "@ant-design/icons/SearchOutlined";
import SettingOutlined from "@ant-design/icons/SettingOutlined";
import {
  faBan,
  faCheck,
  faUserCheck,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Input,
  Layout,
  message,
  Segmented,
  Select,
  Space,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { debounce } from "lodash-es";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import {
  ChangeEvent,
  ReactElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import styled from "styled-components";
import {
  CAPTION_LIST_PAGE_SIZE,
  CaptionList,
} from "../../common/components/caption-list";
import { routeNames } from "../../route-types";
import { ProfileSidebar } from "./profile-sidebar";

const { Title } = Typography;
const { Content, Header } = Layout;

/**
 * Captions are filtered on the server, so wait for the user to stop typing
 * before asking for a new page of results.
 */
const TITLE_FILTER_DEBOUNCE_MS = 400;

const getFirstQueryValue = (
  value: string | string[] | undefined,
): string | undefined => {
  return Array.isArray(value) ? value[0] : value;
};

const getQueryValues = (value: string | string[] | undefined): string[] => {
  if (Array.isArray(value)) {
    return value;
  }
  return value ? [value] : [];
};

const ProfileHeader = styled(Header)`
  &.ant-layout-header {
    background-color: ${colors.white};
    height: unset;
    line-height: unset;
    .ant-space-horizontal,
    .ant-space-item {
      height: unset;
    }
    @media ${DEVICE.tablet} {
      height: 64px;
      line-height: 64px;
    }
  }
`;

const Username = styled.div`
  display: flex;
  align-items: baseline;
  font-size: 2em;
  font-weight: 600;
  background-color: ${colors.white};
  padding-top: 20px;

  @media ${DEVICE.tablet} {
    padding-top: 0px;
    font-size: 3em;
  }

  em {
    font-weight: 400;
    font-size: 0.6em;
  }

  .anticon {
    font-size: 0.5em;
  }
`;

const ProfileLayout = styled(Layout)`
  &.ant-layout.ant-layout-has-sider {
    flex-direction: column;
    @media ${DEVICE.tablet} {
      flex-direction: row;
    }
  }
`;

export const EMPTY_PROFILE: CaptionerFields = {
  donationLink: "",
  languageCodes: [],
  name: "",
  nameTag: 0,
  profileMessage: "",
  recs: 0,
  captionCount: 0,
  userId: "",
  verified: false,
  banned: false,
  lastSubmissionTime: 0,
  isAdmin: false,
  isReviewer: false,
  isReviewerManager: false,
};

type ProfileProps = {
  currentCaptionPage: number;
  loggedInUser?: CaptionerFields;
  privateData?: CaptionerPrivateFields;
  captions: CaptionListFields[];
  captioner?: CaptionerFields;
  isLoading?: boolean;
  isLoadingCaptionPage?: boolean;
  isEditing?: boolean;
  canEdit?: boolean;
  hasMore: boolean; // has more captions to load
  onChangePage?: (
    page: number,
    pageSize?: number,
    tags?: string[],
    advancedFilter?: AdvancedFilter,
    titleFilter?: string,
  ) => void;
  onDelete?: (caption: CaptionListFields) => void;
  onDownloadCaption?: (captionId: string) => void;
  onSetEditing?: (isEditing: boolean) => void;
  onSubmitEdit?: (form: EditProfileFields) => void;
  onCancelEdit?: () => void;
  onAssignReviewerManager: () => void;
  onAssignReviewer: () => void;
  onVerifyCaptioner: () => void;
  onBanCaptioner: () => void;
  onSetFilters: (
    tags: string[],
    advancedFilter: AdvancedFilter,
    titleFilter: string,
  ) => void;
  onUpdateCaption: (captionId: string) => void;
};

export const Profile = ({
  loggedInUser = EMPTY_PROFILE,
  privateData,
  onChangePage,
  onDelete,
  onDownloadCaption,
  currentCaptionPage: currentCaptionPage,
  captions,
  captioner = EMPTY_PROFILE,
  isLoading,
  isLoadingCaptionPage,
  isEditing,
  canEdit,
  hasMore,
  onSetEditing = () => {
    /*do nothing*/
  },
  onSubmitEdit = () => {
    /*do nothing*/
  },
  onCancelEdit = () => {
    /*do nothing*/
  },
  onAssignReviewerManager = () => {
    /*do nothing*/
  },
  onAssignReviewer = () => {
    /*do nothing*/
  },
  onVerifyCaptioner = () => {
    /*do nothing*/
  },
  onBanCaptioner = () => {
    /*do nothing*/
  },
  onSetFilters,
  onUpdateCaption,
}: ProfileProps): ReactElement => {
  const { t } = useTranslation("common");
  const {
    captionCount,
    userId: captionerId,
    name,
    nameTag,
    verified,
    banned,
    isReviewer: isProfileReviewer,
    isReviewerManager: isProfileReviewerManager,
    captionTags = [],
  } = captioner;

  const isOwnProfile = !!privateData;

  const existingTags = useMemo(() => {
    return captionTags
      .map((tag) => ({ ...getCaptionTagFromTagString(tag), tag }))
      .filter(Boolean);
  }, [captionTags]);

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [advancedFilter, setAdvancedFilterState] =
    useState<AdvancedFilter>("all");
  // What the user is currently typing
  const [titleFilterInput, setTitleFilterInput] = useState<string>("");
  // The debounced value that the caption list is currently filtered by
  const [titleFilter, setTitleFilter] = useState<string>("");

  const router = useRouter();
  const hasPerformedInitialFilter = useRef(false);
  const applyTitleFilter = useRef<(value: string) => void>(() => {
    /*do nothing*/
  });
  const inClient = useIsClient();

  useEffect(() => {
    const defaultFilterTagNames = getQueryValues(router.query.tags);
    if (
      hasPerformedInitialFilter.current ||
      // Query params are only parsed after hydration for statically generated pages
      !router.isReady ||
      // The captioner's tags are needed to resolve the tag names in the url
      (defaultFilterTagNames.length > 0 && existingTags.length <= 0)
    ) {
      return;
    }
    hasPerformedInitialFilter.current = true;

    const advancedQuery = router.query.advanced;
    const initialAdvanced: AdvancedFilter =
      advancedQuery === "advanced" || advancedQuery === "nonAdvanced"
        ? advancedQuery
        : "all";

    const defaultTags = existingTags
      .filter((tag) => {
        return tag.name && defaultFilterTagNames.includes(tag.name);
      })
      .map((tag) => tag.tag);

    const initialTitleFilter = (getFirstQueryValue(router.query.title) || "")
      .trim()
      .slice(0, MAX_CAPTION_TITLE_FILTER_LENGTH);

    if (
      defaultTags.length > 0 ||
      initialAdvanced !== "all" ||
      initialTitleFilter
    ) {
      setSelectedTags(defaultTags);
      setAdvancedFilterState(initialAdvanced);
      setTitleFilterInput(initialTitleFilter);
      setTitleFilter(initialTitleFilter);
      onSetFilters(defaultTags, initialAdvanced, initialTitleFilter);
    }
  }, [existingTags, router.isReady, router.query]);

  const filteredCount =
    captions.length +
    (currentCaptionPage - 1) * CAPTION_LIST_PAGE_SIZE +
    (hasMore ? 1 : 0);

  const isFiltering =
    selectedTags.length > 0 || advancedFilter !== "all" || !!titleFilter;
  const currentCaptionListCount = isFiltering ? filteredCount : captionCount;

  const handleCopyProfileLink = () => {
    if (navigator && navigator.clipboard) {
      navigator.clipboard.writeText(
        `${window.location.protocol + "//" + window.location.hostname}/capper/${
          loggedInUser.userId
        }`,
      );
    }
    message.info(t("profile.profileLinkCopiedMessage"));
  };

  const handleClickSettings = () => {
    router.push(routeNames.captioner.settings);
  };

  const syncFiltersToUrl = (
    tags: string[],
    advanced: AdvancedFilter,
    title: string,
  ) => {
    const newUrl = new URL(window.location.href);
    newUrl.search = "";
    if (tags.length > 0) {
      tags.map((tag) => {
        newUrl.searchParams.append("tags", getCaptionGroupTagName(tag));
      });
    }
    if (advanced !== "all") {
      newUrl.searchParams.set("advanced", advanced);
    }
    if (title) {
      newUrl.searchParams.set("title", title);
    }
    window.history.pushState({}, document.title, newUrl);
  };

  const handleChangeTagFilter = (tags: string[]) => {
    setSelectedTags(tags);
    onSetFilters(tags, advancedFilter, titleFilter);
    syncFiltersToUrl(tags, advancedFilter, titleFilter);
  };

  const handleChangeAdvancedFilter = (value: AdvancedFilter) => {
    setAdvancedFilterState(value);
    onSetFilters(selectedTags, value, titleFilter);
    syncFiltersToUrl(selectedTags, value, titleFilter);
  };

  /**
   * Kept up to date on every render so that the debounced handler below always
   * applies the filter with the latest props and filter state.
   */
  useEffect(() => {
    applyTitleFilter.current = (value: string) => {
      const newTitleFilter = value.trim();
      // Typing and undoing a search within the debounce window leaves the list
      // as it is instead of requesting the same page again
      if (newTitleFilter === titleFilter) {
        return;
      }
      setTitleFilter(newTitleFilter);
      onSetFilters(selectedTags, advancedFilter, newTitleFilter);
      syncFiltersToUrl(selectedTags, advancedFilter, newTitleFilter);
    };
  });

  const commitTitleFilter = useMemo(
    () =>
      debounce(
        (value: string) => applyTitleFilter.current(value),
        TITLE_FILTER_DEBOUNCE_MS,
      ),
    [],
  );

  useEffect(() => {
    return () => {
      commitTitleFilter.cancel();
    };
  }, [commitTitleFilter]);

  const handleChangeTitleFilter = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setTitleFilterInput(value);
    commitTitleFilter(value);
  };

  const handleOnChangePage = (page: number, pageSize: number) => {
    onChangePage?.(page, pageSize, selectedTags, advancedFilter, titleFilter);
  };

  return (
    <div style={{ flex: "1", display: "flex", flexDirection: "column" }}>
      <Layout style={{ height: "100%" }}>
        <ProfileHeader style={{ textAlign: "left", paddingLeft: "20px" }}>
          <div>
            <Username>
              {isLoading && <span>{t("common.loading")}</span>}
              {!isLoading && (
                <>
                  {name}
                  <em style={{ marginRight: "10px" }}>#{nameTag}</em>
                </>
              )}
              <Space>
                {!isEditing && canEdit && (
                  <Tooltip title={t("common.edit")}>
                    <EditOutlined
                      onClick={() => onSetEditing(true)}
                      style={{
                        fontSize: "0.5em",
                        color: colors.good,
                      }}
                    />
                  </Tooltip>
                )}
                {banned && (
                  <Tooltip title={t("common.banned")}>
                    <FontAwesomeIcon
                      icon={faBan}
                      color={colors.dislike}
                      style={{ fontSize: "0.5em", marginLeft: "10px" }}
                    />
                  </Tooltip>
                )}
                {!banned && verified && (
                  <Tooltip title={t("common.verified")}>
                    <FontAwesomeIcon
                      icon={faCheck}
                      color={colors.like}
                      style={{ fontSize: "0.5em", marginLeft: "10px" }}
                    />
                  </Tooltip>
                )}
                {isProfileReviewerManager && (
                  <Tooltip title={t("common.reviewerManager")}>
                    <FontAwesomeIcon
                      icon={faUsers}
                      color={colors.like}
                      style={{ fontSize: "0.5em" }}
                    />
                  </Tooltip>
                )}
                {isProfileReviewer && (
                  <Tooltip title={t("common.reviewer")}>
                    <FontAwesomeIcon
                      icon={faUserCheck}
                      color={colors.like}
                      style={{ fontSize: "0.5em" }}
                    />
                  </Tooltip>
                )}
                {isOwnProfile && (
                  <Tooltip title={t("profile.copyProfileLink")}>
                    <CopyOutlined onClick={handleCopyProfileLink} />
                  </Tooltip>
                )}
              </Space>
              {isOwnProfile && (
                <SettingOutlined
                  style={{ marginLeft: "auto", fontSize: "18px" }}
                  onClick={handleClickSettings}
                />
              )}
            </Username>
          </div>
        </ProfileHeader>
        <Content style={{ display: "flex", flexDirection: "column" }}>
          <ProfileLayout style={{ height: "100%" }}>
            <ProfileSidebar
              captioner={captioner}
              loggedInUser={loggedInUser}
              privateData={privateData}
              isLoading={!!isLoading}
              isEditing={!!isEditing}
              onAssignReviewerManager={onAssignReviewerManager}
              onAssignReviewer={onAssignReviewer}
              onVerifyCaptioner={onVerifyCaptioner}
              onBanCaptioner={onBanCaptioner}
              onSubmit={onSubmitEdit}
              onCancel={onCancelEdit}
            />
            <Content style={{ width: "auto" }}>
              <div style={{ padding: "40px 40px" }}>
                <Title level={3}>{t("profile.contributedCaptions")}</Title>
                {/* do a client check to prevent ssr issues */}
                {inClient && (
                  <Segmented<AdvancedFilter>
                    style={{ marginBottom: 6 }}
                    value={advancedFilter}
                    onChange={handleChangeAdvancedFilter}
                    options={[
                      { label: t("profile.advancedFilter.all"), value: "all" },
                      {
                        label: t("profile.advancedFilter.advanced"),
                        value: "advanced",
                      },
                      {
                        label: t("profile.advancedFilter.nonAdvanced"),
                        value: "nonAdvanced",
                      },
                    ]}
                  />
                )}
                {inClient && (
                  <Input
                    allowClear
                    prefix={<SearchOutlined />}
                    maxLength={MAX_CAPTION_TITLE_FILTER_LENGTH}
                    placeholder={t("profile.filterByTitle")}
                    aria-label={t("profile.filterByTitle")}
                    value={titleFilterInput}
                    style={{ width: "100%", marginBottom: 6 }}
                    onChange={handleChangeTitleFilter}
                  />
                )}
                {inClient && (
                  <Select
                    mode="multiple"
                    maxTagCount={5}
                    showSearch
                    placeholder={t("profile.filterByTags", {
                      maxTags: MAX_SEARCH_TAG_LIMIT,
                    })}
                    value={selectedTags}
                    style={{ width: "100%", marginBottom: 6 }}
                    onChange={handleChangeTagFilter}
                    notFoundContent={t("profile.noTags")}
                  >
                    {existingTags.map((tag) => {
                      return (
                        <Select.Option
                          key={tag.name}
                          value={tag.tag}
                          label={tag.name}
                          disabled={
                            selectedTags.length >= MAX_SEARCH_TAG_LIMIT &&
                            !selectedTags.includes(tag.tag)
                          }
                        >
                          <Tag color={tag.color}>{tag.name}</Tag>
                        </Select.Option>
                      );
                    })}
                  </Select>
                )}

                <CaptionList
                  loggedInUser={loggedInUser}
                  captions={captions}
                  totalCount={currentCaptionListCount}
                  captionerId={captionerId}
                  isLoadingCaptionPage={isLoadingCaptionPage}
                  currentPage={currentCaptionPage}
                  onChangePage={handleOnChangePage}
                  onDelete={onDelete}
                  onDownloadCaption={onDownloadCaption}
                  listContainsCurrentPageOnly={true}
                  onUpdateCaption={onUpdateCaption}
                  onSelectTag={handleChangeTagFilter}
                />
              </div>
            </Content>
          </ProfileLayout>
        </Content>
      </Layout>
    </div>
  );
};
