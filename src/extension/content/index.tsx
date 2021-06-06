import "@/antd-override.css";
import {
  EDITOR_PORTAL_ELEMENT_ID,
  VIDEO_ELEMENT_CONTAINER_ID,
  Z_INDEX,
} from "@/common/constants";
import { requestFreshTabData } from "@/common/feature/video/actions";
import { PageType } from "@/common/feature/video/types";
import {
  processorOrder,
  videoSourceToProcessorMap,
} from "@/common/feature/video/utils";
import { PassthroughProvider } from "@/common/providers/passthrough-provider";
import { storeInitPromise } from "@/common/store/store-non-background";
import {
  ChromeMessage,
  ChromeMessageType,
  NotificationMessage,
  ProviderType,
} from "@/common/types";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { message as notificationMessage } from "antd";
import * as Parse from "parse";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import "react-virtualized/styles.css";
import { saveCaptionToDisk } from "../../common/feature/caption-editor/saver";
import "../../libs/patch-worker/patch-worker";
import { ExtensionProvider } from "../common/extension-provider";
import {
  getEditorRawCaptionStorageKey,
  getRawCaptionStorageKey,
} from "../common/raw-caption-keys";
import { ContentHome } from "./containers/content-home";
import { Processor } from "./processors/processor";
import "./provider";
import { createInpageMenuPortalElement, refreshVideoMeta } from "./utils";

const siteProcessors: Processor[] = processorOrder.map(
  (processorKey) => videoSourceToProcessorMap[processorKey],
);

const providerMap = {
  [ProviderType.Parse]: PassthroughProvider,
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
  globalThis.isInExtension = true;

  globalThis.selectedProcessor = siteProcessors.find((processor) => {
    return location.href.match(processor.urlRegex) !== null;
  });
  if (!globalThis.selectedProcessor) {
    return;
  }
  const pageType = globalThis.selectedProcessor.getPageType(location.href);

  const autoLoadCaptionId = new URL(location.href).searchParams.get("nekocap");
  createEditorPortalElement();
  createVideoUIPortalElement();
  createInpageMenuPortalElement();
  chrome.runtime.onMessage.addListener(
    (message: ChromeMessage, sender, sendResponse) => {
      if (message.type === ChromeMessageType.SaveFile) {
        if (!message.payload) {
          return;
        }
        saveCaptionToDisk(message.payload);
      } else if (message.type === ChromeMessageType.ContentScriptUpdate) {
        if (globalThis.pageType !== PageType.Video) {
          return;
        }
        refreshVideoMeta().then(() => {
          sendResponse({
            status: "alive",
            videoId: globalThis.videoId,
            videoSource: globalThis.videoSource,
            pageType: globalThis.pageType,
          });
        });
        return true;
      } else if (message.type === ChromeMessageType.InfoMessage) {
        const infoMessage = message.payload as NotificationMessage;
        notificationMessage.info(
          infoMessage.message,
          infoMessage.duration || 4,
        );
      } else if (message.type === ChromeMessageType.RawCaption) {
        if (message.payload.isEditor) {
          globalThis.editorRawCaption = message.payload.rawCaption;
          chrome.storage.local.set({
            [getEditorRawCaptionStorageKey(globalThis.tabId)]:
              globalThis.editorRawCaption,
          });
        } else {
          globalThis.rawCaption = message.payload.rawCaption;
          chrome.storage.local.set({
            [getRawCaptionStorageKey(globalThis.tabId)]: globalThis.rawCaption,
          });
        }
        sendResponse(true);
      } else if (message.type === ChromeMessageType.GetContentScriptVariables) {
        const variables = message.payload.map((variableName) => {
          return globalThis[variableName];
        });
        sendResponse(variables);
      }
    },
  );

  await refreshVideoMeta();

  const { store } = await storeInitPromise;

  if (pageType !== PageType.SearchResults) {
    // Get and store the current tab id
    chrome.runtime.sendMessage(
      { type: ChromeMessageType.GetTabId },
      (response) => {
        globalThis.tabId = response;
        if (pageType === PageType.Video) {
          // Initialize the tab data once we have the id
          store.dispatch(
            requestFreshTabData({
              tabId: globalThis.tabId,
              newVideoId: globalThis.videoId,
              newVideoSource: globalThis.videoSource,
              newPageType: globalThis.pageType,
              newCaptionId: autoLoadCaptionId || undefined,
              currentUrl: location.href,
            }),
          );
        }
      },
    );
  }

  // Initialize a content copy of the provider
  // This is necessary to introduce introduce the right amount of delay before rendering the content
  globalThis.backendProvider = await new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { type: ChromeMessageType.GetProviderType },
      (providerType: ProviderType) => {
        switch (providerType) {
          case ProviderType.Parse:
          default:
            resolve(new providerMap[providerType](Parse));
        }
      },
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
  const root = createRoot(container);
  root.render(
    <ExtensionProvider>
      <Provider store={store}>
        <ContentHome />
      </Provider>
    </ExtensionProvider>,
  );
};

initialize();
