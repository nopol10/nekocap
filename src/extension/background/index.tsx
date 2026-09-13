import { chromeProm } from "@/common/chrome-utils";
import { isFirefoxExtension, isInServiceWorker } from "@/common/client-utils";
import { autoLogin, loginSuccess } from "@/common/feature/login/actions";
import { FirebaseLoggedInUser } from "@/common/feature/login/types";
import { closeTab, requestFreshTabData } from "@/common/feature/video/actions";
import { LoginMethod, UserData } from "@/common/providers/backend-provider";
import { performBackendProviderRequest } from "@/common/providers/provider-utils";
import type { RootState } from "@/common/store/types";
import {
  BackgroundRequest,
  ChromeExternalMessageType,
  ChromeMessage,
  ChromeMessageType,
} from "@/common/types";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
} from "firebase/auth/web-extension";
import debounce from "lodash/debounce";
import "./common/provider";
import { backgroundStoreInitPromise } from "./common/store";
import { UserExtensionPreferenceState } from "./feature/user-extension-preference/types";
import { initFirebase } from "./firebase";
import { removeAllTemporaryRawCaptions } from "./remove-temporary-raw-caption";

// Dev-only: poll a sentinel file written by the watch driver and reload the
// extension when its contents change. The `process.env.NODE_ENV` check is
// replaced at build time by Vite's define, so this whole block is dropped from
// production bundles.
if (process.env.NODE_ENV !== "production") {
  let lastReloadValue: string | null = null;
  const sentinelUrl = chrome.runtime.getURL(".reload");
  setInterval(async () => {
    try {
      const res = await fetch(sentinelUrl, { cache: "no-store" });
      if (!res.ok) return;
      const value = await res.text();
      if (lastReloadValue === null) {
        lastReloadValue = value;
      } else if (value !== lastReloadValue) {
        console.log("[dev] Rebuild detected — reloading extension");
        chrome.runtime.reload();
      }
    } catch {
      // sentinel may not exist yet
    }
  }, 1000);
}

// Clear redux but keep user preferences
chrome.runtime.onStartup.addListener(async () => {
  console.log("Extension started");
  const savedState = await chromeProm.storage.local.get(["reduxed"]);
  removeAllTemporaryRawCaptions();
  let storedPreferences: UserExtensionPreferenceState | null = null;
  if (savedState && savedState.reduxed) {
    const state: RootState = savedState.reduxed;
    storedPreferences = state.userExtensionPreference;
  }
  chrome.storage.local.remove("reduxed", () => {
    // Restore preferences
    if (storedPreferences) {
      chrome.storage.local.set({
        reduxed: { userExtensionPreference: storedPreferences },
      });
    }
  });
});

if (typeof self !== undefined && isInServiceWorker()) {
  self.addEventListener("activate", () => {
    console.log("Extension service worker activated");
  });
}

// Firebase for auth
// initFirebase() throws when the Firebase values in .env are missing/invalid,
// which used to crash this whole script before it reached the onMessage
// listener below, silently breaking the extension on every site. Set
// NEXT_PUBLIC_SKIP_FIREBASE_AUTH_INIT=true locally to keep going without auth.
let auth: ReturnType<typeof getAuth> | undefined;
try {
  ({ auth } = initFirebase(getAuth));
} catch (e) {
  if (process.env.NEXT_PUBLIC_SKIP_FIREBASE_AUTH_INIT !== "true") {
    throw e;
  }
  console.warn(
    "NEXT_PUBLIC_SKIP_FIREBASE_AUTH_INIT is set: continuing without Firebase auth after an init failure.",
    e,
  );
}
if (auth && (isInServiceWorker() || isFirefoxExtension())) {
  const authenticatedAuth = auth;
  initStore().then(({ store }) => {
    onAuthStateChanged(authenticatedAuth, (user) => {
      if (user && user.uid && !globalThis.skipAutoLogin) {
        store.dispatch(autoLogin.request());
      }
    });
  });
}

chrome.runtime.onMessageExternal.addListener(
  (message, sender, sendResponse) => {
    if (message.type === ChromeExternalMessageType.GoogleAuthCredentials) {
      // Complete the rest of the sign in process
      const { id, credentialIdToken, idToken, name } =
        message.payload as FirebaseLoggedInUser;
      const credential = GoogleAuthProvider.credential(credentialIdToken);
      // auth is only ever undefined via the NEXT_PUBLIC_SKIP_FIREBASE_AUTH_INIT
      // dev bypass above, in which case there's no real login flow to complete.
      signInWithCredential(auth!, credential).then(async () => {
        const { store } = await backgroundStoreInitPromise;
        const userData: UserData =
          await globalThis.backendProvider.completeDeferredLogin(
            LoginMethod.Google,
            {
              id,
              username: name,
              idToken: idToken,
            },
            {
              id,
              access_token: idToken,
            },
          );
        store.dispatch(loginSuccess(userData));
        sendResponse(userData);
      });
      return true;
    }
    return false;
  },
);

async function initStore() {
  return backgroundStoreInitPromise;
}

// const BackgroundPage = ({ children }: { children?: ReactNode }) => {
//   const dispatch = useDispatch();
//   // Keep track of whether an auto login has been attempted to prevent anoter auto login after the auto login
//   const autoLoggedIn = useRef<boolean>(false);
//   useEffect(() => {
//     // Perform auto login if a user exists
//     // Calling onAuthStateChanged at any time will always trigger the callback if a user exists,
//     // even if the auth process completed before the addition of this callback
//     firebase.auth().onAuthStateChanged((user) => {
//       if (
//         user &&
//         user.uid &&
//         !autoLoggedIn.current &&
//         !globalThis.skipAutoLogin
//       ) {
//         autoLoggedIn.current = true;
//         dispatch(autoLogin.request());
//       }
//     });
//   }, []);
//   return <>{children}</>;
// };

async function performBackgroundRequest(options: BackgroundRequest) {
  const { url, method, responseType } = options;
  const response = await new Promise<any>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.responseType = responseType;
    xhr.onload = function () {
      if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) {
        if (options.responseType === "arraybuffer") {
          // @ts-ignore
          resolve(Array.from(new Uint8Array(xhr.response)));
        } else {
          resolve(xhr.response);
        }
        return;
      }
      reject("[Background request] Invalid status or response");
    };
    xhr.onerror = reject;
    xhr.send(null);
  });
  return response;
}

chrome.runtime.onMessage.addListener(
  (request: ChromeMessage, sender, sendResponse) => {
    if (request.type === ChromeMessageType.GetTabId) {
      sendResponse(sender.tab?.id);
    } else if (request.type === ChromeMessageType.GetProviderType) {
      sendResponse(globalThis.backendProvider.type());
    } else if (request.type === ChromeMessageType.Request) {
      const response = { data: null, error: null };
      performBackgroundRequest(request.payload)
        .then((data) => {
          response.data = data;
          sendResponse(response);
        })
        .catch((error) => {
          response.error = error;
          sendResponse(response);
        });
      return true;
    } else if (request.type === ChromeMessageType.ProviderRequest) {
      performBackendProviderRequest(request.payload).then((response) => {
        sendResponse(response);
      });
      return true;
    } else if (request.type === ChromeMessageType.VideoIframeToBackground) {
      const senderTabId = sender.tab?.id;
      if (senderTabId === undefined) {
        return;
      }
      chrome.tabs.sendMessage(senderTabId, {
        ...request,
        type: ChromeMessageType.VideoIframeToContent,
      });
    }
  },
);

chrome.tabs.onRemoved.addListener(async (tabId: number) => {
  const { store } = await initStore();
  store.dispatch(closeTab({ tabId }));
});

// Youtube fires multiple history update events in quick succession when opening a video.
// Throttle the updates so that multiple contents scripts will not get added
const debouncedHistoryUpdateListener = debounce(async (details) => {
  const { store } = await initStore();
  const { tabId, url } = details;
  chrome.tabs.sendMessage(
    tabId,
    { type: ChromeMessageType.ContentScriptUpdate },
    (res) => {
      res = res || {};
      const newPageType = res.pageType;
      const newVideoId = res.videoId;
      const newVideoSource = res.videoSource;
      const currentUrlString =
        store.getState().video?.tabData[tabId]?.currentUrl || "";
      try {
        // We don't want to refresh if the url is the same
        const currentUrl = new URL(currentUrlString);
        const newUrl = new URL(url);
        // In case the user used a url that loads the caption directly
        currentUrl.searchParams.delete("nekocap");
        newUrl.searchParams.delete("nekocap");
        if (
          currentUrl.origin === newUrl.origin &&
          currentUrl.pathname === newUrl.pathname &&
          currentUrl.search === newUrl.search
        ) {
          return;
        }
      } catch (e) {
        console.log("Error parsing url", e);
      }

      store.dispatch(
        requestFreshTabData({
          tabId,
          newVideoId,
          newVideoSource,
          newPageType,
          currentUrl: url,
        }),
      );
    },
  );
}, 1000);

chrome.webNavigation.onHistoryStateUpdated.addListener(
  debouncedHistoryUpdateListener,
);

// storeInitPromise.then(({ store }) => {
//   document.addEventListener("DOMContentLoaded", function () {
//     const Wrapper = window.backendProvider.wrapper;
//     ReactDOM.render(
//       <Provider store={store}>
//         <Wrapper providerProps={window.backendProvider.getWrapperProps(store)}>
//           <BackgroundPage>NekoCap</BackgroundPage>
//         </Wrapper>
//       </Provider>,
//       document.getElementById("background")
//     );
//   });
// });
