import { $generateHtmlFromNodes } from "@lexical/html";
import { LexicalEditor } from "lexical";

/**
 * Extract background-color from an <nr> wrapper tag using DOMParser.
 * Returns the color value and the inner HTML with the <nr> tag stripped.
 */
export function extractNrTag(html: string): {
  backgroundColor: string;
  innerHtml: string;
} {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const nrElement = doc.body.querySelector("nr");
  if (nrElement) {
    const bgColor = nrElement.getAttribute("background-color") || "";
    nrElement.replaceWith(...Array.from(nrElement.childNodes));
    return { backgroundColor: bgColor, innerHtml: doc.body.innerHTML };
  }
  return { backgroundColor: "", innerHtml: html };
}

/**
 * Convert the persisted WebVTT-flavoured HTML (with <c.x>, <v x>, <nc>) into
 * the plain HTML Lexical can consume via $generateNodesFromDOM. Wraps the
 * result in a single <p> and converts newlines to <br>.
 *
 * The caller is expected to have already stripped any outer <nr> wrapper via
 * extractNrTag, since <nr> is reapplied at serialise time from prop state.
 */
export function webvttToLexicalHtml(html: string): string {
  const processed = html
    .replace(/<c\.([^>]+)>/g, '<span class="$1">')
    .replace(/<\/c>/g, "</span>")
    .replace(/<v ([^>]+)>/g, '<span title="$1">')
    .replace(/<\/v>/g, "</span>")
    .replace(/<nc\s+style="([^"]*)"/g, '<span style="$1"')
    .replace(/<\/nc>/g, "</span>");

  return `<p>${processed.replace(/\n/g, "<br>")}</p>`;
}

/**
 * Recursively serialize a DOM tree (produced by `$generateHtmlFromNodes`) into
 * the WebVTT-like format we persist to Redux.
 *
 * Lexical exports a TextNode with bold/italic format AND a `color` style as
 * `<i><b><strong style="color: ...">...</strong></b></i>`: the format flags
 * become outer <b>/<i> wrappers AND become the inner tag (<strong>/<em>) via
 * `getElementInnerTag`, and the `style` ends up on the inner tag. To keep
 * `color` round-trippable we have to emit it as a separate `<nc style="...">`
 * wrapper rather than leave the style on the format tag — on reload, Lexical's
 * default <strong>/<em>/<b>/<i> importers only carry bold/italic/etc. flags
 * from style, dropping the colour entirely.
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
    childContent = `<nc style="color: ${color}">${childContent}</nc>`;
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
      return childContent;
    default:
      if (el.children.length === 0 && !childContent) {
        return "";
      }
      return childContent;
  }
}

export function serializeEditorToHtml(
  editor: LexicalEditor,
  backgroundColor: string | undefined,
): string {
  const rawHtml = $generateHtmlFromNodes(editor, null);
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, "text/html");
  let html = Array.from(doc.body.childNodes).map(serializeNode).join("").trim();
  if (backgroundColor) {
    html = `<nr background-color="${backgroundColor}">${html}</nr>`;
  }
  return html;
}
