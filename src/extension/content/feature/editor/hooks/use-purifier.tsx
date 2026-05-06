import DOMPurify from "dompurify";
import { useState, useEffect } from "react";
import { SAFE_STYLE_RE } from "../../../containers/caption-renderer";

export function usePurifier() {
  const [purifier, setPurifier] = useState<typeof DOMPurify>();
  useEffect(function setupPurifier() {
    const newPurifier = DOMPurify();
    const sanitizerHook = (node, data) => {
      if (data.attrName === "style") {
        const style = data.attrValue;
        data.attrValue = SAFE_STYLE_RE.test(style.trim()) ? style.trim() : "";

        if (data.attrValue === "") {
          data.forceKeepAttr = false;
          node.removeAttribute("style");
        }
      }
    };
    setPurifier(newPurifier);
    newPurifier.addHook("uponSanitizeAttribute", sanitizerHook);
    return () => {
      newPurifier.removeHook("uponSanitizeAttribute", sanitizerHook);
      setPurifier(undefined);
    };
  }, []);
  return purifier;
}
