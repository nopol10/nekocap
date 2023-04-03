/**
 * Very specific function for forcing an enter keyup
 */
export function triggerEnterKeyupEvent(element: Element | null) {
  if (!element) {
    return;
  }
  const keyboardEvent = new KeyboardEvent("keyup", {
    code: "Enter",
    key: "Enter",
    view: window,
    bubbles: true,
  });
  element?.dispatchEvent(keyboardEvent);
}
