import * as React from "react";
import * as ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { Store } from "webext-redux";
import { message as notificationMessage } from "antd";
import {
  getVideoTitle,
  getVideoElement,
  Processor,
} from "./processors/processor";
import "@/antd-override.css";
import {
  ChromeMessage,
  ChromeMessageType,
  NotificationMessage,
  ProviderType,
} from "@/common/types";
import { ContentHome } from "./containers/content-home";
import { ParseProvider } from "@/common/providers/parse/parse-provider";
import "../../ant-global-scoped.less";
import "../../ant-content.less";
import "react-virtualized/styles.css";
import {
  EDITOR_PORTAL_ELEMENT_ID,
  VIDEO_ELEMENT_CONTAINER_ID,
  Z_INDEX,
} from "@/common/constants";
import { ExportCaptionResult } from "@/common/feature/caption-editor/types";
import { saveAs } from "file-saver";
import "../../libs/patch-worker/patch-worker";
import { PageType } from "@/common/feature/video/types";
import { requestFreshTabData } from "@/common/feature/video/actions";
import {
  processorOrder,
  videoSourceToProcessorMap,
} from "@/common/feature/video/utils";
import * as Parse from "parse";

const siteProcessors: Processor[] = processorOrder.map(
  (processorKey) => videoSourceToProcessorMap[processorKey]
); // Object.values(videoSourceToProcessorMap);

const providerMap = {
  [ProviderType.Parse]: ParseProvider,
};

const refreshVideoMeta = async () => {
  const pageType = window.selectedProcessor.getPageType(window.location.href);
  window.pageType = pageType;
  window.videoId = "";

  if (pageType === PageType.Video) {
    window.videoElement = await getVideoElement(window.selectedProcessor);

    /**
     * The captionContainerElement might not be correct when using the video's parent
     * as some sites shift the elements around before the video ends up in its final position.
     * Thus we need to update the container element later as a precaution
     */
    window.captionContainerElement = window.videoElement.parentElement;

    window.videoName = await getVideoTitle(window.selectedProcessor);
    const videoId = window.selectedProcessor.getVideoId();
    const videoSource = window.selectedProcessor.type;
    window.videoId = videoId;
    window.videoSource = videoSource;

    const extensionContainer = document.getElementById(
      VIDEO_ELEMENT_CONTAINER_ID
    );
    return extensionContainer;
  }
  return;
};

const createEditorPortalElement = () => {
  if (document.getElementById(EDITOR_PORTAL_ELEMENT_ID)) {
    return;
  }
  const editorRootStyle = `
    position: fixed;
    top: 0px;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: ${Z_INDEX.EDITOR};
    pointer-events: none;
  `;
  const editorElement = document.createElement("div");
  editorElement.style.cssText = editorRootStyle;
  editorElement.id = EDITOR_PORTAL_ELEMENT_ID;
  document.body.appendChild(editorElement);
};

/**
 * The container for the UI for the video controls (caption selection, editor menu) will always be in the page.
 * It will be the portal for the VideoHome container to render into.
 * VideoHome will move it to the correct position when it mounts and move it back out when it unmounts
 */
const createVideoUIPortalElement = () => {
  if (document.getElementById(VIDEO_ELEMENT_CONTAINER_ID)) {
    return;
  }
  const videoUIRootStyle = `
    display: none;
  `;

  const videoUIElement = document.createElement("div");
  videoUIElement.id = VIDEO_ELEMENT_CONTAINER_ID;
  videoUIElement.style.cssText = videoUIRootStyle;
  document.body.appendChild(videoUIElement);
};

const initialize = async () => {
  window.isInExtension = true;
  createEditorPortalElement();
  createVideoUIPortalElement();
  chrome.runtime.onMessage.addListener(
    (message: ChromeMessage, sender, sendResponse) => {
      if (message.type === ChromeMessageType.SaveFile) {
        if (!message.payload) {
          return;
        }
        const {
          captionString,
          filename,
        } = message.payload as ExportCaptionResult;
        const blob = new Blob([captionString], {
          type: "text/plain;charset=utf-8",
        });
        saveAs(blob, filename);
      } else if (message.type === ChromeMessageType.ContentScriptUpdate) {
        refreshVideoMeta().then(() => {
          sendResponse({
            status: "alive",
            videoId: window.videoId,
            videoSource: window.videoSource,
            pageType: window.pageType,
          });
        });
        return true;
      } else if (message.type === ChromeMessageType.InfoMessage) {
        const infoMessage = message.payload as NotificationMessage;
        notificationMessage.info(
          infoMessage.message,
          infoMessage.duration || 4
        );
      }
    }
  );

  window.selectedProcessor = siteProcessors.find((processor) => {
    return location.href.match(processor.urlRegex) !== null;
  });

  if (!window.selectedProcessor) {
    return;
  }

  await refreshVideoMeta();

  const store = new Store();
  await store.ready();

  // Get and store the current tab id
  chrome.runtime.sendMessage(
    { type: ChromeMessageType.GetTabId },
    (response) => {
      window.tabId = response;
      // Initialize the tab data once we have the id
      store.dispatch(
        requestFreshTabData({
          tabId: window.tabId,
          newVideoId: window.videoId,
          newVideoSource: window.videoSource,
          newPageType: window.pageType,
        })
      );
    }
  );

  // Initialize a content copy of the provider
  window.backendProvider = await new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { type: ChromeMessageType.GetProviderType },
      (providerType: ProviderType) => {
        switch (providerType) {
          case ProviderType.Parse:
          default:
            resolve(new providerMap[providerType](Parse));
        }
      }
    );
  });

  const container = document.createElement("div");
  container.id = "nekocap-container";
  document.body.appendChild(container);

  /**
   * Render the content element into the body
   * Child elements will render through portals to various parts of the page
   * This allows us to have one content script managing all the different page variations for sites that use pushState for navigation
   */
  ReactDOM.render(
    <Provider store={store}>
      <ContentHome />
    </Provider>,
    container
  );
};

initialize();
