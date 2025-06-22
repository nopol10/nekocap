import { colors } from "@/common/colors";
import { Expandable } from "@/common/components/expandable";
import { WSButton } from "@/common/components/ws-button";
import { WSSelect } from "@/common/components/ws-select";
import { WSSpace } from "@/common/components/ws-space";
import {
  createNewCaption,
  exportCaption,
  fetchAutoCaptionList,
  loadLocallySavedCaption,
  saveLocalCaption,
  setShowSubmitModalOpen,
  updateShowEditor,
} from "@/common/feature/caption-editor/actions";
import {
  inWebEditorSelector,
  isUserCaptionLoadedSelector,
  showEditorIfPossibleSelector,
  tabEditorDataSelector,
} from "@/common/feature/caption-editor/selectors";
import { isLoggedInSelector } from "@/common/feature/login/selectors";
import {
  closeMenuBar,
  dislikeCaption,
  likeCaption,
  loadCaptions,
  loadServerCaption,
  updateLoadedCaptionFromFile,
  updateRenderer,
  updateShowCaption,
} from "@/common/feature/video/actions";
import { CaptionTags } from "@/common/feature/video/components/caption-tags";
import { CAPTION_RENDERER_DATA } from "@/common/feature/video/constants";
import {
  availableRenderersSelector,
  tabVideoDataSelector,
} from "@/common/feature/video/selectors";
import {
  CaptionRendererType,
  LoadCaptionsResult,
  UpdateLoadedCaptionFromFile,
} from "@/common/feature/video/types";
import { videoSourceToProcessorMap } from "@/common/feature/video/utils";
import { languages } from "@/common/languages";
import { darkModeSelector } from "@/common/processor-utils";
import { ThunkedPayloadAction } from "@/common/store/action";
import { DEVICE } from "@/common/style-constants";
import { CaptionFileFormat } from "@/common/types";
import { hasSaveData } from "@/extension/background/feature/caption-editor/utils";
import { toggleAutosave } from "@/extension/background/feature/user-extension-preference/actions";
import { shouldAutosaveSelector } from "@/extension/background/feature/user-extension-preference/selectors";
import { useIsInPopup } from "@/hooks";
import CheckOutlined from "@ant-design/icons/CheckOutlined";
import CloseOutlined from "@ant-design/icons/CloseOutlined";
import DislikeTwoTone from "@ant-design/icons/DislikeTwoTone";
import LikeTwoTone from "@ant-design/icons/LikeTwoTone";
import {
  Dropdown,
  Menu,
  message,
  Select,
  Space,
  Spin,
  Switch,
  Tooltip,
} from "antd";
import type { RcFile } from "antd/lib/upload";
import { MenuClickEventHandler } from "rc-menu/lib/interface";
import * as React from "react";
import { CSSProperties, useCallback, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { AutoCaptionsModal } from "../feature/editor/containers/auto-captions-modal";
import { CreateCaptionWarningModal } from "../feature/editor/containers/create-caption-warning-modal";
import { ConfirmSaveModal } from "./confirm-save-modal";
import { SubmitCaptionModal } from "./submit-caption-modal";
import { SelectFileModal } from "./upload-caption-modal";
const { OptGroup } = Select;

const AUTOSAVE_TOGGLE_KEY = "autosave-toggle";

type LikeTextProps = {
  $activated?: boolean;
};

const MenuRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  flex-direction: row;
  column-gap: 8px;
  row-gap: 4px;
  align-items: center;
  max-width: min(330px, 70vw);

  @media ${DEVICE.tablet} {
    max-width: unset;
  }
`;

const LikeText = styled.span<LikeTextProps>`
  color: ${({ $activated }) => ($activated ? colors.like : undefined)};
  ${({ $activated }) =>
    darkModeSelector(`
    color: ${$activated ? colors.darkModeLike : colors.white};
  `)}
`;

const DislikeText = styled.span<LikeTextProps>`
  color: ${({ $activated }) => ($activated ? colors.dislike : undefined)};
  ${({ $activated }) =>
    darkModeSelector(`
    color: ${$activated ? colors.darkModeDislike : colors.white};
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
  tags,
  advanced,
}: LoadCaptionsResult) => {
  const language = languages[languageCode];
  const optionLabel = `${language} by ${captionerName || "Unknown"}`;
  const selectedLabel = `${language}`;
  return (
    <Select.Option value={id} label={selectedLabel} key={`cap-${id}`}>
      <Space>
        <span>{optionLabel}</span>
        <WSSpace $direction="horizontal" style={{ alignItems: "center" }}>
          <CaptionTags caption={{ advanced: advanced, tags }}></CaptionTags>
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
        </WSSpace>
      </Space>
    </Select.Option>
  );
};

type VideoPageMenuProps = {
  inEditorScreen?: boolean;
  style?: CSSProperties;
  onLoginRequired?: () => void;
};

export const VideoPageMenu = ({
  inEditorScreen = false,
  style,
  onLoginRequired,
}: VideoPageMenuProps) => {
  const dispatch = useDispatch();
  const isLoggedIn = useSelector(isLoggedInSelector);
  const tabData = useSelector(tabVideoDataSelector(globalThis.tabId));
  const editorTabData = useSelector(tabEditorDataSelector(globalThis.tabId));
  const isLoadingCaptionList = useSelector(
    loadCaptions.isLoading(globalThis.tabId),
  );
  const loadingCaptionListError = useSelector(
    loadCaptions.error(globalThis.tabId),
  );
  const isUserCaptionLoaded = useSelector(
    isUserCaptionLoadedSelector(globalThis.tabId),
  );
  const showEditorIfPossible = useSelector(
    showEditorIfPossibleSelector(globalThis.tabId),
  );
  const availableRenderers = useSelector(
    availableRenderersSelector(globalThis.tabId),
  );
  const shouldAutosave = useSelector(shouldAutosaveSelector);
  const [isConfirmSaveOpen, setIsConfirmSaveOpen] = useState(false);
  const [isSelectFileOpen, setIsSelectFileOpen] = useState(false);
  const [isCreateCaptionWarningOpen, setIsCreateCaptionWarningOpen] =
    useState(false);
  const [isAutoCaptionListOpen, setIsAutoCaptionListOpen] = useState(false);
  const [editorMenuVisible, setEditorMenuVisible] = useState(false);
  const inWebEditor = useSelector(inWebEditorSelector);
  const isInPopup = useIsInPopup();
  const isSubmitOpen = editorTabData?.showSubmitModalOpen || false;
  const setIsSubmitOpen = (isOpen: boolean) => {
    dispatch(setShowSubmitModalOpen({ tabId: globalThis.tabId, show: isOpen }));
  };

  const newLoadedFileAction =
    useRef<ThunkedPayloadAction<UpdateLoadedCaptionFromFile>>();

  const handleForceSave = useCallback(() => {
    setIsConfirmSaveOpen(false);
    dispatch(
      saveLocalCaption.request({
        tabId: globalThis.tabId,
        videoId: globalThis.videoId,
        videoSource: globalThis.videoSource,
      }),
    ).then(() => {
      message.success("Saved!");
    });
  }, [dispatch]);

  const handleSave = useCallback(async () => {
    const hasSave = await hasSaveData(
      globalThis.videoId,
      globalThis.videoSource,
    );
    if (hasSave) {
      setIsConfirmSaveOpen(true);
      return;
    }
    handleForceSave();
  }, [handleForceSave, setIsConfirmSaveOpen]);

  const handleExport = useCallback(
    (fileFormat: keyof typeof CaptionFileFormat) => {
      dispatch(
        exportCaption.request({
          tabId: globalThis.tabId,
          format: fileFormat,
        }),
      );
    },
    [dispatch],
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

  const showCaption = tabData?.showCaption ?? true;

  const caption = editorTabData ? editorTabData.caption : tabData?.caption;
  const selectedRenderer = tabData?.renderer;
  const editorEnabled = !globalThis.selectedProcessor?.disableEditor;

  const handleClickFromFile = () => {
    setIsSelectFileOpen(true);
  };

  const handleClickFromLocalSave = async () => {
    await runPreOpenEditorAction();
    dispatch(
      loadLocallySavedCaption.request({
        videoId: globalThis.videoId,
        videoSource: globalThis.videoSource,
        tabId: globalThis.tabId,
      }),
    )
      .then(() => {
        /* no content */
      })
      .catch(() => {
        message.error("Could not find a saved caption for this video!");
      });
  };

  const handleClickCreate = async () => {
    await runPreOpenEditorAction();
    dispatch(
      createNewCaption.request({
        videoId: globalThis.videoId,
        videoSource: globalThis.videoSource,
        tabId: globalThis.tabId,
      }),
    );
  };

  const handleCancelConfirmSaveModal = () => {
    setIsConfirmSaveOpen(false);
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
    const fileCopy = Object.assign(
      Object.create(Object.getPrototypeOf(file)),
      file,
    );
    const nameParts = file.name.split(".");
    const fileType = nameParts[nameParts.length - 1];
    setIsSelectFileOpen(false);
    newLoadedFileAction.current = updateLoadedCaptionFromFile({
      file: fileCopy,
      type: fileType,
      content,
      tabId: globalThis.tabId,
      videoId: globalThis.videoId,
      videoSource: globalThis.videoSource,
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

  const handleAfterFileModalClose = async () => {
    await runPreOpenEditorAction();
    if (newLoadedFileAction.current) {
      dispatch(newLoadedFileAction.current);
    }
    newLoadedFileAction.current = undefined;
  };

  const handleFetchAutoCaptionList = () => {
    setIsAutoCaptionListOpen(true);
    dispatch(
      fetchAutoCaptionList.request({
        tabId: globalThis.tabId,
        videoId: globalThis.videoId,
        videoSource: globalThis.videoSource,
      }),
    );
  };

  const renderEditorMenu = () => {
    const canExport =
      editorTabData &&
      editorTabData.caption &&
      editorTabData.caption.data &&
      editorTabData.caption.data.tracks &&
      editorTabData.caption.data.tracks.length > 0;

    const handleClickEditorMenu: MenuClickEventHandler = (e) => {
      if (e.key !== AUTOSAVE_TOGGLE_KEY) {
        setEditorMenuVisible(false);
      }
    };

    return (
      <Menu onClick={handleClickEditorMenu}>
        {editorEnabled && (
          <Menu.Item onClick={handleClickCreate}>New</Menu.Item>
        )}
        {editorEnabled && (
          <Menu.Item onClick={handleSave}>Save (local)</Menu.Item>
        )}
        <Menu.SubMenu title="Load">
          <Menu.Item onClick={handleClickFromFile}>Load from file</Menu.Item>
          {editorEnabled && (
            <Menu.Item onClick={handleClickFromLocalSave}>
              Load from local save
            </Menu.Item>
          )}
        </Menu.SubMenu>
        {canExport && (
          <Menu.SubMenu title="Export">
            <Menu.Item onClick={() => handleExport("srt")}>SRT</Menu.Item>
          </Menu.SubMenu>
        )}
        {editorEnabled && renderAutoCaptionButton()}
        {renderAutoSaveToggle()}
        {editorEnabled && renderShowEditorButton()}
        {renderUploadButton()}
      </Menu>
    );
  };

  const handleUpdateRenderer =
    (renderer: CaptionRendererType) =>
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      dispatch(updateRenderer({ tabId: globalThis.tabId, renderer }));
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

  const runPreOpenEditorAction = useCallback(async () => {
    if (globalThis.videoSource !== undefined) {
      const preOpenEditorAction =
        videoSourceToProcessorMap[globalThis.videoSource]?.preOpenEditorAction;
      if (preOpenEditorAction) {
        await preOpenEditorAction();
      }
    }
  }, []);

  const handleClickShowHideCaption = () => {
    dispatch(
      updateShowCaption({ tabId: globalThis.tabId, show: !showCaption }),
    );
  };

  const handleClickOpenCloseEditor = async () => {
    // Show a warning if opening the editor when only raw caption for ASS is available
    if (!showEditorIfPossible) {
      if (!caption || (caption.data && caption.data.tracks.length <= 0)) {
        setIsCreateCaptionWarningOpen(true);
        return;
      }
    }
    await runPreOpenEditorAction();
    dispatch(
      updateShowEditor({
        tabId: globalThis.tabId,
        show: !showEditorIfPossible,
      }),
    );
  };

  const handleClickSubmitCaption = () => {
    if (!isLoggedIn) {
      if (globalThis.isInExtension) {
        message.info(
          "Login from the NekoCap extension icon to use this feature!",
        );
        return;
      }
      onLoginRequired?.();
      return;
    }
    setIsSubmitOpen(true);
  };

  const handleLoadServerCaption = (captionId) => {
    dispatch(loadServerCaption.request({ tabId: globalThis.tabId, captionId }));
  };

  const handleToggleAutosave = (info) => {
    dispatch(toggleAutosave());
  };

  const renderShowHideButton = () => {
    if (!caption) {
      return null;
    }
    const label = showCaption ? "Hide caption" : "Show caption";

    return <WSButton onClick={handleClickShowHideCaption}>{label}</WSButton>;
  };

  const renderRawLoadingState = () => {
    if (tabData && tabData.isLoadingRawCaption) {
      const percentage =
        tabData.rawLoadPercentage !== undefined &&
        tabData.rawLoadPercentage !== null
          ? `${tabData.rawLoadPercentage.toFixed(0)}%`
          : "";
      return <div>Loading... {percentage}</div>;
    }
  };

  const renderShowEditorButton = () => {
    if (!isUserCaptionLoaded || inWebEditor) {
      return null;
    }
    const label = showEditorIfPossible ? "Close Editor" : "Open Editor";

    return <Menu.Item onClick={handleClickOpenCloseEditor}>{label}</Menu.Item>;
  };

  const renderAutoCaptionButton = () => {
    if (
      !inEditorScreen ||
      !globalThis.selectedProcessor?.supportAutoCaptions(globalThis.videoId)
    ) {
      return null;
    }

    return (
      <Menu.Item onClick={handleFetchAutoCaptionList}>
        Use auto-captions
      </Menu.Item>
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
    dispatch(likeCaption.request({ tabId: globalThis.tabId }));
  };

  const handleClickDislike = () => {
    dispatch(dislikeCaption.request({ tabId: globalThis.tabId }));
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
            <LikeText $activated={!!userLike}>{likes}</LikeText>
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
            <DislikeText $activated={!!userDislike}>{dislikes}</DislikeText>
          </div>
        </Tooltip>
      </Space>
    );
  };

  const renderCaptionerProfileLink = () => {
    if (!caption || !caption.creator || !caption.creatorName) {
      return null;
    }
    return (
      <>
        by
        <a
          target="_blank"
          rel="noreferrer"
          href={`${process.env.NEXT_PUBLIC_WEBSITE_URL}capper/${caption.creator}`}
          style={{
            fontWeight: "bold",
            fontSize: "14px",
            color: colors.base,
            maxWidth: "180px",
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          }}
        >
          {caption.creatorName}
        </a>
      </>
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
          minWidth: "128px",
        }}
        dropdownAlign={{
          points: ["bl", "tl"],
        }}
        value={caption?.id || null}
      >
        {captionOptions}
      </WSSelect>
    );
  };

  const handleCloseMenuBar = () => {
    dispatch(closeMenuBar({ tabId: globalThis.tabId }));
  };

  const handleEditorMenuVisibleChange = (visible: boolean) => {
    setEditorMenuVisible(visible);
  };

  return (
    <>
      <MenuRow>
        {!inEditorScreen && (
          <>
            {editorEnabled && !isInPopup && (
              <WSButton onClick={handleCloseMenuBar}>
                <CloseOutlined />
              </WSButton>
            )}
            <Spin spinning={isLoadingCaptionList}>
              <Tooltip trigger={"hover"} title={loadingCaptionListError}>
                {renderCaptionList()}
              </Tooltip>
            </Spin>
          </>
        )}
        {renderCaptionerProfileLink()}
        {availableRenderers.length > 0 && (
          <Dropdown overlay={renderRendererMenu()} placement={"topCenter"}>
            <WSButton>Renderer</WSButton>
          </Dropdown>
        )}
        {
          <Dropdown
            overlay={renderEditorMenu()}
            open={editorMenuVisible}
            onOpenChange={handleEditorMenuVisibleChange}
            placement={"topCenter"}
          >
            <WSButton>Editor</WSButton>
          </Dropdown>
        }
        {renderShowHideButton()}
        {renderRawLoadingState()}
        {!inEditorScreen && renderLikeButtons()}
      </MenuRow>
      <ConfirmSaveModal
        visible={isConfirmSaveOpen}
        onCancel={handleCancelConfirmSaveModal}
        onDone={handleForceSave}
      />
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
