import XMLHttpRequestPolyfill from "./xmlhttprequest-shim/index";

export function initXMLHttpRequestShim() {
  if (typeof XMLHttpRequest !== "undefined") {
    return;
  }
  // @ts-ignore
  globalThis.XMLHttpRequest = XMLHttpRequestPolyfill;
}
