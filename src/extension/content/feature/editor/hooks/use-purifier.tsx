import DOMPurify from "dompurify";
import { useEffect, useRef } from "react";
import { SAFE_STYLE_RE } from "../../../containers/caption-renderer";

export function usePurifier() {
  const purifier = useRef<typeof DOMPurify>();
  useEffect(function setupPurifier() {
    const newPurifier = DOMPurify();
    const sanitizerHook: DOMPurify.UponSanitizeAttributeHook = (node, data) => {
      if (data.attrName === "style") {
        const style = data.attrValue;
        data.attrValue = SAFE_STYLE_RE.test(style.trim()) ? style.trim() : "";

        if (data.attrValue === "") {
          data.forceKeepAttr = false;
          node.removeAttribute("style");
        }
      }
    };
    newPurifier.addHook("uponSanitizeAttribute", sanitizerHook);
    purifier.current = newPurifier;
    return () => {
      newPurifier.removeHook("uponSanitizeAttribute", sanitizerHook);
      purifier.current = undefined;
    };
  }, []);
  return purifier.current;
}
