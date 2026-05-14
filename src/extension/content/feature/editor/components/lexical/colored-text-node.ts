import {
  $applyNodeReplacement,
  $isTextNode,
  DOMConversionMap,
  DOMConversionOutput,
  SerializedTextNode,
  TextNode,
} from "lexical";

/**
 * TextNode subclass that preserves the `color` style attribute when importing
 * <span style="color: ..."> elements via Lexical's HTML pipeline. Lexical's
 * default convertSpanElement only carries over bold/italic/underline/etc.
 * format flags and discards the `color` value, so without this override the
 * previously-applied font color would get stripped every time the editor
 * remounts (e.g. when a neighbouring cue's end time changes, flipping this
 * cue's row key) and then written back to Redux by OnChangeHtmlPlugin.
 */
export class ColoredTextNode extends TextNode {
  static getType(): string {
    return "colored-text";
  }

  static clone(node: ColoredTextNode): ColoredTextNode {
    return new ColoredTextNode(node.__text, node.__key);
  }

  static importDOM(): DOMConversionMap | null {
    const importers = TextNode.importDOM();
    return {
      ...importers,
      span: () => ({
        conversion: $convertSpanElementPreservingColor,
        priority: 1,
      }),
    };
  }

  static importJSON(serializedNode: SerializedTextNode): ColoredTextNode {
    return $applyNodeReplacement(
      new ColoredTextNode(serializedNode.text),
    ).updateFromJSON(serializedNode);
  }

  exportJSON(): SerializedTextNode {
    return {
      ...super.exportJSON(),
      type: "colored-text",
    };
  }
}

function $convertSpanElementPreservingColor(
  domNode: HTMLSpanElement,
): DOMConversionOutput {
  const styleAttr = domNode.getAttribute("style") || "";
  const colorMatch = styleAttr.match(/color\s*:\s*([^;]+)/i);
  const color = colorMatch ? colorMatch[1].trim().replace(/;$/, "") : null;

  const cssStyle = domNode.style;
  const fontWeight = cssStyle.fontWeight;
  const textDecoration = (cssStyle.textDecoration || "").split(" ");
  const hasBoldFontWeight = fontWeight === "700" || fontWeight === "bold";
  const hasItalicFontStyle = cssStyle.fontStyle === "italic";
  const hasUnderlineTextDecoration = textDecoration.includes("underline");
  const hasLinethroughTextDecoration = textDecoration.includes("line-through");
  const verticalAlign = cssStyle.verticalAlign;

  return {
    node: null,
    forChild: (lexicalNode) => {
      if (!$isTextNode(lexicalNode)) {
        return lexicalNode;
      }
      if (hasBoldFontWeight && !lexicalNode.hasFormat("bold")) {
        lexicalNode.toggleFormat("bold");
      }
      if (hasItalicFontStyle && !lexicalNode.hasFormat("italic")) {
        lexicalNode.toggleFormat("italic");
      }
      if (hasUnderlineTextDecoration && !lexicalNode.hasFormat("underline")) {
        lexicalNode.toggleFormat("underline");
      }
      if (
        hasLinethroughTextDecoration &&
        !lexicalNode.hasFormat("strikethrough")
      ) {
        lexicalNode.toggleFormat("strikethrough");
      }
      if (verticalAlign === "sub" && !lexicalNode.hasFormat("subscript")) {
        lexicalNode.toggleFormat("subscript");
      }
      if (verticalAlign === "super" && !lexicalNode.hasFormat("superscript")) {
        lexicalNode.toggleFormat("superscript");
      }
      if (color) {
        lexicalNode.setStyle(`color: ${color}`);
      }
      return lexicalNode;
    },
  };
}
