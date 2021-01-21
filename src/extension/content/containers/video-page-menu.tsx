import message from "antd/lib/message";
import Dropdown from "antd/lib/dropdown/dropdown";
import Menu from "antd/lib/menu";
import Space from "antd/lib/space";
import * as React from "react";
import { useDispatch, useSelector } from "react-redux";
import { CSSProperties, useCallback, useMemo, useRef, useState } from "react";
import { RcFile } from "antd/lib/upload";
import {
  loadCaptions,
  updateLoadedCaptionFromFile,
  updateShowCaption,
  loadServerCaption,
  likeCaption,
  dislikeCaption,
  updateRenderer,
  closeMenuBar,
} from "@/common/feature/video/actions";
import { isLoggedInSelector } from "@/common/feature/login/selectors";
import {
  availableRenderersSelector,
  tabVideoDataSelector,
} from "@/common/feature/video/selectors";
import { SelectFileModal } from "./upload-caption-modal";
import { SubmitCaptionModal } from "./submit-caption-modal";
import Select from "antd/lib/select";
import { languages } from "@/common/languages";
import Spin from "antd/lib/spin";
import Tooltip from "antd/lib/tooltip";
import {
  CaptionRendererType,
  LoadCaptionsResult,
  UpdateLoadedCaptionFromFile,
} from "@/common/feature/video/types";
import DislikeTwoTone from "@ant-design/icons/DislikeTwoTone";
import LikeTwoTone from "@ant-design/icons/LikeTwoTone";
import CheckOutlined from "@ant-design/icons/CheckOutlined";
import CloseOutlined from "@ant-design/icons/CloseOutlined";
import { colors } from "@/common/colors";
import { Expandable } from "@/common/components/expandable";
import { captionTags } from "@/common/constants";
import { AudioDescribedTag } from "@/common/components/ws-tag";
import {
  isUserCaptionLoadedSelector,
  showEditorIfPossibleSelector,
  tabEditorDataSelector,
} from "@/common/feature/caption-editor/selectors";
import {
  createNewCaption,
  exportCaption,
  fetchAutoCaptionList,
  fixOverlaps,
  loadLocallySavedCaption,
  saveLocalCaption,
  updateEditorCaption,
  updateShowEditor,
} from "@/common/feature/caption-editor/actions";
import { CAPTION_RENDERER_DATA } from "@/common/feature/video/constants";
import { CaptionFileFormat } from "@/common/types";
import { WSButton } from "@/common/components/ws-button";
import styled, { css } from "styled-components";
import { styledNoPass } from "@/common/style-utils";
import { darkModeSelector } from "@/common/processor-utils";
import { WSSelect } from "@/common/components/ws-select";
import { CreateCaptionWarningModal } from "../feature/editor/containers/create-caption-warning-modal";
import { AutoCaptionsModal } from "../feature/editor/containers/auto-captions-modal";
import { ThunkedPayloadAction } from "@/common/store/action";
import { Switch } from "antd";
import { toggleAutosave } from "@/extension/background/feature/user-extension-preference/actions";
import { shouldAutosaveSelector } from "@/extension/background/feature/user-extension-preference/selectors";
const { OptGroup } = Select;

const AUTOSAVE_TOGGLE_KEY = "autosave-toggle";

type LikeTextProps = {
  activated?: boolean;
};

const LikeText = styledNoPass<LikeTextProps, "span">("span")`
  color: ${({ activated }: LikeTextProps) =>
    activated ? colors.like : undefined};
  ${darkModeSelector(css`
    color: ${({ activated }: LikeTextProps) =>
      activated ? colors.darkModeLike : colors.white};
  `)}
`;

const DislikeText = styledNoPass<LikeTextProps, "span">("span")`
  color: ${({ activated }: LikeTextProps) =>
    activated ? colors.dislike : undefined};
  ${darkModeSelector(css`
    color: ${({ activated }: LikeTextProps) =>
      activated ? colors.darkModeDislike : colors.white};
  `)}
`;

const ToggleItem = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

const captionOptionCreator = ({
  languageCode,
  id,
  captionerName,
  likes,
  dislikes,
  verified,
  tags,
}: LoadCaptionsResult) => {
  const language = languages[languageCode];
  const label = `${language} by ${captionerName || "Unknown"}`;
  const audioDescribed = tags.includes(captionTags.audioDescribed);
  return (
    <Select.Option value={id} label={label} key={`cap-${id}`}>
      <Space>
        <span>{label}</span>
        <Space>
          {audioDescribed && <AudioDescribedTag />}
          <div>
            <LikeTwoTone
              twoToneColor={colors.like}
              style={{ color: colors.like, marginRight: "4px" }}
            />
            {likes}
          </div>
          <div>
            <DislikeTwoTone
              twoToneColor={colors.dislike}
              style={{ color: colors.dislike, marginRight: "4px" }}
            />
            {dislikes}
          </div>
        </Space>
      </Space>
    </Select.Option>
  );
};

type VideoPageMenuProps = {
  inEditorScreen?: boolean;
  style?: CSSProperties;
};

export const VideoPageMenu = ({
  inEditorScreen = false,
  style,
}: VideoPageMenuProps) => {
  const dispatch = useDispatch();
  const isLoggedIn = useSelector(isLoggedInSelector);
  const tabData = useSelector(tabVideoDataSelector(window.tabId));
  const editorTabData = useSelector(tabEditorDataSelector(window.tabId));
  const isLoadingCaptionList = useSelector(
    loadCaptions.isLoading(window.tabId)
  );
  const loadingCaptionListError = useSelector(loadCaptions.error(window.tabId));
  const isUserCaptionLoaded = useSelector(
    isUserCaptionLoadedSelector(window.tabId)
  );
  const showEditorIfPossible = useSelector(
    showEditorIfPossibleSelector(window.tabId)
  );
  const availableRenderers = useSelector(
    availableRenderersSelector(window.tabId)
  );
  const shouldAutosave = useSelector(shouldAutosaveSelector);
  const [isSelectFileOpen, setIsSelectFileOpen] = useState(false);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [isCreateCaptionWarningOpen, setIsCreateCaptionWarningOpen] = useState(
    false
  );
  const [isAutoCaptionListOpen, setIsAutoCaptionListOpen] = useState(false);
  const [editorMenuVisible, setEditorMenuVisible] = useState(false);

  const newLoadedFileAction = useRef<
    ThunkedPayloadAction<UpdateLoadedCaptionFromFile>
  >(undefined);

  const handleSave = useCallback(() => {
    dispatch(
      saveLocalCaption.request({
        tabId: window.tabId,
        videoId: window.videoId,
        videoSource: window.videoSource,
      })
    ).then(() => {
      message.success("Saved!");
    });
  }, []);

  const handleExport = useCallback(
    (fileFormat: keyof typeof CaptionFileFormat) => {
      dispatch(
        exportCaption.request({
          tabId: window.tabId,
          format: fileFormat,
        })
      );
    },
    []
  );

  const captionOptions = useMemo(() => {
    if (!tabData || !tabData.serverCaptionList) {
      return null;
    }
    const captions = tabData.serverCaptionList;
    const verifiedCaptions = [
      ...captions.filter((sub) => sub.verified).map(captionOptionCreator),
    ];
    const unverifiedCaptions = [
      ...captions.filter((sub) => !sub.verified).map(captionOptionCreator),
    ];
    return (
      <>
        {verifiedCaptions.length > 0 && (
          <OptGroup label="Verified">{verifiedCaptions}</OptGroup>
        )}
        {unverifiedCaptions.length > 0 && (
          <OptGroup label="Unverified">{unverifiedCaptions}</OptGroup>
        )}
      </>
    );
  }, [tabData]);

  const showCaption = tabData ? tabData.showCaption : true;
  const caption = editorTabData ? editorTabData.caption : tabData?.caption;
  const selectedRenderer = tabData?.renderer;

  const handleClickFromFile = () => {
    setIsSelectFileOpen(true);
  };

  const handleClickFromLocalSave = () => {
    dispatch(
      loadLocallySavedCaption.request({
        videoId: window.videoId,
        videoSource: window.videoSource,
        tabId: window.tabId,
      })
    )
      .then(() => {
        /* no content */
      })
      .catch(() => {
        message.error("Could not find a saved caption for this video!");
      });
  };

  const handleClickCreate = () => {
    dispatch(
      createNewCaption.request({
        videoId: window.videoId,
        videoSource: window.videoSource,
        tabId: window.tabId,
      })
    );
  };

  const handleCancelSelectFileModal = () => {
    setIsSelectFileOpen(false);
  };

  const handleCancelSubmitModal = () => {
    setIsSubmitOpen(false);
  };

  const handleCancelCreateCaptionWarningModal = () => {
    setIsCreateCaptionWarningOpen(false);
  };

  const handleCancelAutoCaptionListModal = () => {
    setIsAutoCaptionListOpen(false);
  };

  const handleFileSelected = (file: RcFile, content: string) => {
    if (!file || !content) {
      return;
    }
    const fileCopy = { ...file };
    const nameParts = file.name.split(".");
    const fileType = nameParts[nameParts.length - 1];
    setIsSelectFileOpen(false);
    newLoadedFileAction.current = updateLoadedCaptionFromFile({
      file: fileCopy,
      type: fileType,
      content,
      tabId: window.tabId,
      videoId: window.videoId,
      videoSource: window.videoSource,
    });
    /**
     * The action to load the file will be dispatched AFTER the modal has completely closed.
     * This prevents closing the editor due to loading an ASS file from causing the body overflow
     * to remain set as hidden.
     * Sequence of events:
     * 1. Editor is open (body overflow [bo] set to hidden)
     * 2. File load modal is open (registers original overflow as hidden, bo set to hidden)
     * 3. File load modal closes (restores bo to original, i.e. hidden)
     * 4. ASS file loads, triggers closure of editor (bo set to unset)
     *
     * If 3 and 4 are reversed, the body overflow will remain set to hidden after the editor is closed. ❌
     */
  };

  const handleAfterFileModalClose = () => {
    if (newLoadedFileAction.current) {
      dispatch(newLoadedFileAction.current);
    }
    newLoadedFileAction.current = undefined;
  };

  const handleFetchAutoCaptionList = () => {
    setIsAutoCaptionListOpen(true);
    dispatch(
      fetchAutoCaptionList.request({
        tabId: window.tabId,
        videoId: window.videoId,
        videoSource: window.videoSource,
      })
    );
  };

  const renderEditorMenu = () => {
    const canExport =
      editorTabData.caption &&
      editorTabData.caption.data &&
      editorTabData.caption.data.tracks &&
      editorTabData.caption.data.tracks.length > 0;

    const handleClickEditorMenu = (e: {
      key: string | number;
      domEvent: React.MouseEvent<HTMLElement>;
    }) => {
      if (e.key !== AUTOSAVE_TOGGLE_KEY) {
        setEditorMenuVisible(false);
      }
    };

    return (
      <Menu onClick={handleClickEditorMenu}>
        <Menu.Item onClick={handleClickCreate}>New</Menu.Item>
        <Menu.Item onClick={handleSave}>Save (local)</Menu.Item>
        <Menu.SubMenu title="Load">
          <Menu.Item onClick={handleClickFromFile}>Load from file</Menu.Item>
          <Menu.Item onClick={handleClickFromLocalSave}>
            Load from local save
          </Menu.Item>
        </Menu.SubMenu>
        {canExport && (
          <Menu.SubMenu title="Export">
            <Menu.Item onClick={() => handleExport("srt")}>SRT</Menu.Item>
          </Menu.SubMenu>
        )}
        {renderAutoCaptionButton()}
        {renderAutoSaveToggle()}
        {renderShowEditorButton()}
        {renderUploadButton()}
      </Menu>
    );
  };

  const handleUpdateRenderer = (renderer: CaptionRendererType) => (
    event: React.MouseEvent<HTMLAnchorElement>
  ) => {
    dispatch(updateRenderer({ tabId: window.tabId, renderer }));
    event.preventDefault();
  };

  const renderRendererMenu = () => {
    return (
      <Menu>
        {availableRenderers.map((renderer) => {
          return (
            <Menu.Item key={renderer}>
              <a href="#" onClick={handleUpdateRenderer(renderer)}>
                {CAPTION_RENDERER_DATA[renderer].name}
                {selectedRenderer === renderer && (
                  <CheckOutlined style={{ marginLeft: "5px" }} />
                )}
              </a>
            </Menu.Item>
          );
        })}
      </Menu>
    );
  };

  const handleClickShowHideCaption = () => {
    dispatch(updateShowCaption({ tabId: window.tabId, show: !showCaption }));
  };

  const handleClickOpenCloseEditor = () => {
    // Show a warning if opening the editor when only raw caption for ASS is available
    if (!showEditorIfPossible) {
      if (!caption || (caption.data && caption.data.tracks.length <= 0)) {
        setIsCreateCaptionWarningOpen(true);
        return;
      }
    }
    dispatch(
      updateShowEditor({ tabId: window.tabId, show: !showEditorIfPossible })
    );
  };

  const handleClickSubmitCaption = () => {
    if (!isLoggedIn) {
      message.info(
        "Login from the NekoCap extension icon to use this feature!"
      );
      return;
    }
    setIsSubmitOpen(true);
  };

  const handleLoadServerCaption = (captionId) => {
    dispatch(loadServerCaption.request({ tabId: window.tabId, captionId }));
  };

  const handleToggleAutosave = (info: {
    domEvent: React.MouseEvent<HTMLElement>;
  }) => {
    dispatch(toggleAutosave());
  };

  const renderShowHideButton = () => {
    if (!caption) {
      return null;
    }
    const label = showCaption ? "Hide caption" : "Show caption";

    return <WSButton onClick={handleClickShowHideCaption}>{label}</WSButton>;
  };

  const renderShowEditorButton = () => {
    if (!isUserCaptionLoaded) {
      return null;
    }
    const label = showEditorIfPossible ? "Close Editor" : "Open Editor";

    return <Menu.Item onClick={handleClickOpenCloseEditor}>{label}</Menu.Item>;
  };

  const renderAutoCaptionButton = () => {
    if (
      !inEditorScreen ||
      !window.selectedProcessor.supportAutoCaptions(window.videoId)
    ) {
      return null;
    }

    return (
      <Menu.Item onClick={handleFetchAutoCaptionList}>
        Use auto-captions
      </Menu.Item>
    );
  };

  const handleClickFixOverlaps = () => {
    dispatch(
      updateEditorCaption({
        action: fixOverlaps({}),
        tabId: window.tabId,
      })
    );
  };

  const renderAutoSaveToggle = () => {
    if (!inEditorScreen) {
      return null;
    }

    return (
      <Menu.Item key={AUTOSAVE_TOGGLE_KEY} onClick={handleToggleAutosave}>
        <ToggleItem>
          <span>Autosave</span>
          <Switch size="small" checked={shouldAutosave} />
        </ToggleItem>
      </Menu.Item>
    );
  };

  const renderUploadButton = () => {
    if (!caption || !caption.loadedByUser) {
      return null;
    }

    return (
      <Menu.Item onClick={handleClickSubmitCaption}>Submit Caption</Menu.Item>
    );
  };

  const handleClickLike = () => {
    dispatch(likeCaption.request({ tabId: window.tabId }));
  };

  const handleClickDislike = () => {
    dispatch(dislikeCaption.request({ tabId: window.tabId }));
  };

  const renderLikeButtons = () => {
    if (!caption || caption.loadedByUser) {
      return;
    }
    const { likes, dislikes, userLike, userDislike } = caption;

    return (
      <Space style={style}>
        <Tooltip placement={"top"} title={"I like this caption"}>
          <div onClick={handleClickLike}>
            <Expandable>
              <LikeTwoTone
                twoToneColor={colors.like}
                style={{
                  color: colors.like,
                  fontSize: "16px",
                  marginRight: "4px",
                }}
              />
            </Expandable>
            <LikeText activated={userLike}>{likes}</LikeText>
          </div>
        </Tooltip>
        <Tooltip placement={"top"} title={"I dislike this caption"}>
          <div onClick={handleClickDislike}>
            <Expandable>
              <DislikeTwoTone
                twoToneColor={colors.dislike}
                style={{
                  color: colors.dislike,
                  fontSize: "16px",
                  marginRight: "4px",
                }}
              />
            </Expandable>
            <DislikeText activated={userDislike}>{dislikes}</DislikeText>
          </div>
        </Tooltip>
      </Space>
    );
  };

  const renderCaptionerProfileLink = () => {
    if (!caption || !caption.creator) {
      return null;
    }
    return (
      <a
        target="_blank"
        rel="noreferrer"
        href={`${process.env.WEBSITE_URL}capper/${caption.creator}`}
        style={{ fontWeight: "bold" }}
      >
        View captioner profile
      </a>
    );
  };

  const renderCaptionList = () => {
    if (
      !tabData ||
      !tabData.serverCaptionList ||
      tabData.serverCaptionList.length <= 0
    ) {
      const label = loadingCaptionListError
        ? "Error, hover to view"
        : "No captions found";
      return <WSButton disabled={true}>{label}</WSButton>;
    }

    return (
      <WSSelect
        placeholder={`Select caption (${tabData.serverCaptionList.length} available)`}
        optionLabelProp={"label"}
        onChange={handleLoadServerCaption}
        dropdownMatchSelectWidth={false}
        style={{
          minWidth: "200px",
        }}
        dropdownAlign={{
          points: ["bl", "tl"],
        }}
      >
        {captionOptions}
      </WSSelect>
    );
  };

  const handleCloseMenuBar = () => {
    dispatch(closeMenuBar({ tabId: window.tabId }));
  };

  const handleEditorMenuVisibleChange = (visible: boolean) => {
    setEditorMenuVisible(visible);
  };

  return (
    <>
      <Space>
        {!inEditorScreen && (
          <>
            <WSButton onClick={handleCloseMenuBar}>
              <CloseOutlined />
            </WSButton>
            <Spin spinning={isLoadingCaptionList}>
              <Tooltip trigger={"hover"} title={loadingCaptionListError}>
                {renderCaptionList()}
              </Tooltip>
            </Spin>
          </>
        )}
        {availableRenderers.length > 0 && (
          <Dropdown overlay={renderRendererMenu()} placement={"topCenter"}>
            <WSButton>Renderer</WSButton>
          </Dropdown>
        )}
        {
          <Dropdown
            overlay={renderEditorMenu()}
            visible={editorMenuVisible}
            onVisibleChange={handleEditorMenuVisibleChange}
            placement={"topCenter"}
          >
            <WSButton>Editor</WSButton>
          </Dropdown>
        }
        {renderShowHideButton()}
        {!inEditorScreen && renderLikeButtons()}
        {renderCaptionerProfileLink()}
      </Space>
      <SelectFileModal
        visible={isSelectFileOpen}
        onCancel={handleCancelSelectFileModal}
        onDone={handleFileSelected}
        afterClose={handleAfterFileModalClose}
      />
      <SubmitCaptionModal
        visible={isSubmitOpen}
        onCancel={handleCancelSubmitModal}
      />
      <CreateCaptionWarningModal
        visible={isCreateCaptionWarningOpen}
        onCancel={handleCancelCreateCaptionWarningModal}
      />
      <AutoCaptionsModal
        visible={isAutoCaptionListOpen}
        onCancel={handleCancelAutoCaptionListModal}
      />
    </>
  );
};
