import { $generateHtmlFromNodes } from "@lexical/html";
import { LexicalEditor } from "lexical";

/**
 * Wrap the persisted caption HTML in a single <p> and convert literal newlines
 * to <br> so Lexical's $generateNodesFromDOM produces a single block.
 */
export function prepareInitialHtml(html: string): string {
  return `<p>${html.replace(/\n/g, "<br>")}</p>`;
}

/**
 * Recursively serialize a DOM tree (produced by `$generateHtmlFromNodes`) into
 * the HTML format we persist to Redux.
 *
 * Lexical exports a TextNode with bold/italic format AND a `color` style as
 * `<i><b><strong style="color: ...">...</strong></b></i>`: the format flags
 * become outer <b>/<i> wrappers AND become the inner tag (<strong>/<em>) via
 * `getElementInnerTag`, and the `style` ends up on the inner tag. To keep
 * `color` round-trippable we emit it as a separate `<span style="color: ...">`
 * wrapper rather than leaving the style on the format tag — on reload,
 * Lexical's default <strong>/<em>/<b>/<i> importers only carry bold/italic/etc.
 * flags from style, dropping the colour entirely.
 *
 * <b>/<i> are treated as passthrough when their only child is the
 * corresponding inner format tag (Lexical's own redundant wrap), so we don't
 * emit `<b><b>text</b></b>` for a single bold node.
 */
function serializeNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent || "";
  }
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return "";
  }
  const el = node as Element;
  const tag = el.tagName.toLowerCase();
  let childContent = Array.from(el.childNodes).map(serializeNode).join("");

  if (tag === "br") return "\n";
  if (tag === "p") return childContent + "\n";

  const styleAttr = el.getAttribute("style") || "";
  const colorMatch = styleAttr.match(/color\s*:\s*([^;]+)/i);
  if (colorMatch) {
    const color = colorMatch[1].trim().replace(/;$/, "");
    childContent = `<span style="color: ${color}">${childContent}</span>`;
  }

  switch (tag) {
    case "strong":
      return `<b>${childContent}</b>`;
    case "em":
      return `<i>${childContent}</i>`;
    case "u":
      return `<u>${childContent}</u>`;
    case "b":
      if (
        el.children.length === 1 &&
        el.children[0].tagName.toLowerCase() === "strong"
      ) {
        return childContent;
      }
      return `<b>${childContent}</b>`;
    case "i":
      if (
        el.children.length === 1 &&
        el.children[0].tagName.toLowerCase() === "em"
      ) {
        return childContent;
      }
      return `<i>${childContent}</i>`;
    case "span":
      // The colour-bearing <span> has already been emitted above; any
      // remaining bare span adds no semantic info, so unwrap it.
      return childContent;
    default:
      if (el.children.length === 0 && !childContent) {
        return "";
      }
      return childContent;
  }
}

export function serializeEditorToHtml(editor: LexicalEditor): string {
  const rawHtml = $generateHtmlFromNodes(editor, null);
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, "text/html");
  return Array.from(doc.body.childNodes).map(serializeNode).join("").trim();
}
