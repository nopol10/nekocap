import {
  BackgroundRequest,
  ChromeExternalMessageType,
  ChromeMessage,
  ChromeMessageType,
} from "@/common/types";
import { autoLogin, loginSuccess } from "@/common/feature/login/actions";
import debounce from "lodash/debounce";
import { closeTab, requestFreshTabData } from "@/common/feature/video/actions";
import { initFirebase } from "./firebase";
import "./common/provider";
import { storeInitPromise } from "./common/store";
import { performBackendProviderRequest } from "@/common/providers/provider-utils";
import { LoginMethod, UserData } from "@/common/providers/backend-provider";
import { FirebaseLoggedInUser } from "@/common/feature/login/types";
import { isInServiceWorker } from "@/common/client-utils";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
} from "firebase/auth";
import { chromeProm } from "@/common/chrome-utils";
import type { RootState } from "@/common/store/types";
import { UserExtensionPreferenceState } from "./feature/user-extension-preference/types";

// Clear redux but keep user preferences
chrome.runtime.onStartup.addListener(async () => {
  console.log("Extension started");
  const savedState = await chromeProm.storage.local.get(["reduxed"]);
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
const { auth } = initFirebase();
if (isInServiceWorker()) {
  initStore().then(({ store }) => {
    onAuthStateChanged(auth, (user) => {
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
      const {
        id,
        credentialIdToken,
        idToken,
        name,
      } = message.payload as FirebaseLoggedInUser;
      const credential = GoogleAuthProvider.credential(credentialIdToken);
      signInWithCredential(auth, credential).then(async () => {
        const { store } = await storeInitPromise;
        const userData: UserData = await globalThis.backendProvider.completeDeferredLogin(
          LoginMethod.Google,
          {
            id,
            username: name,
            idToken: idToken,
          },
          {
            id,
            access_token: idToken,
          }
        );
        store.dispatch(loginSuccess(userData));
        sendResponse(userData);
      });
      return true;
    }
    return false;
  }
);

async function initStore() {
  return storeInitPromise;
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
  const response = await new Promise((resolve, reject) => {
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
    }
  }
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
        })
      );
    }
  );
}, 1000);

chrome.webNavigation.onHistoryStateUpdated.addListener(
  debouncedHistoryUpdateListener
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
