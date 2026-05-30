---
name: nekocap-extension-messaging
description: Use when modifying communication between the extension's background, content, popup, or canvas-iframe processes — adding or renaming a ChromeMessageType, changing the manifest's content-script matches, adding a new video platform, or anything touching MV3 CSP / cross-browser (Chrome vs Firefox) behavior.
---

This skill covers the contract between the four extension processes (background, content, popup, canvas iframe) and the Manifest V3 / cross-browser constraints around them.

## The message contract lives in `src/common/types.ts`

`ChromeMessageType` is the enum that names every message that crosses a process boundary. The current set:

```ts
enum ChromeMessageType {
  Route,
  GetProviderType,
  GetTabId,
  ContentScriptUpdate,
  SaveFile,
  RawCaption,
  InfoMessage,
  GetContentScriptVariables,
  Request,                  // XMLHttpRequest proxied via background
  ProviderRequest,          // BackendProvider call proxied via background
  VideoIframeToBackground,
  VideoIframeToContent,
}
```

Plus `ParentToCanvasIframeMessageType` / `CanvasIframeToParentMessageType` for the Octopus renderer iframe, and `ChromeExternalMessageType` (`GoogleAuthCredentials`) for OAuth completion.

**There is no compile-time check that all senders match all receivers.** A mismatch fails silently at runtime. Treat changes to this enum like a public API change.

## Adding a new message — 5 steps

1. **Add the entry** to the appropriate enum in `src/common/types.ts`.
2. **Define its payload** — either extend `ChromeMessage` (loose typing) or add a variant to the discriminated union that fits (e.g. `ParentToCanvasIframeMessage`).
3. **Add the handler.** Background hub: `src/extension/background/index.tsx`. Content: `src/extension/content/index.tsx`. Popup: `src/extension/popup/index.tsx`. Canvas iframe: `src/extension/content/canvas-iframe/`.
4. **Add the sender** in whichever process initiates the message.
5. **If the message participates in a Redux flow that touches persisted state**, verify the state shape still serializes cleanly through `reduxed-chrome-storage` (see the `nekocap-redux-feature` skill).

## Renaming or removing a message

Search every directory for the old name: `background/`, `content/`, `popup/`, `canvas-iframe/`, and `src/common/`. A missed sender will silently no-op — the receiver just won't fire. Lint and type errors will not catch this.

## MV3 CSP is restrictive

`extension_pages` CSP allows only `'self'`, `*.google.com`, and `'wasm-unsafe-eval'`. The following silently break the extension on load:

- CDN-loaded scripts (jsdelivr, unpkg, …)
- Inline `<script>` tags
- `eval()` or `new Function("...")`
- Dynamically imported scripts from any non-self origin

All runtime code must be bundled by Vite (see `build-extension.ts`). If you need a library, install it via npm so it ends up in the bundle.

## Adding a new video platform

A new platform requires **both** of the following — missing either silently breaks injection:

1. **Processor registry entry** — add to `src/common/feature/video/utils.ts`. This handles platform detection, video element selection, time/duration access, etc.
2. **Content-script `matches`** — add the URL pattern to `content_scripts[].matches` in both `extension-statics/manifest-chrome.json` and `extension-statics/manifest-firefox.json`. The CSS-at-document-start and JS-at-document-end pair must both target the new pattern.

Optional: a URL rewrite in `middleware.ts` if the platform exposes share/embed URLs you want to redirect to `/create`.

## Cross-browser notes

- Manifests are templated per target in `extension-statics/manifest-<target>.json` and combined by `build-extension.ts`.
- Firefox uses `browser_specific_settings.gecko.id` = `nekocaption@gmail.com`.
- The project does **not** use `webextension-polyfill` — it calls the `chrome.*` namespace directly. Firefox supports `chrome.*` aliases for the APIs in use.
- Firebase auth uses the `firebase/auth/web-extension` entry point for both browsers.

## No Sentry on the extension

Sentry is only configured for the Next.js web app. Errors thrown in `background/`, `content/`, `popup/`, or `canvas-iframe/` are not reported anywhere — they only land in the devtools console. Be conservative about throwing across process boundaries; prefer returning error payloads in the message response.

## When you change X, also check Y

| If you change… | Also verify… |
|---|---|
| `ChromeMessageType` enum | Every sender and handler across all four extension processes still matches |
| A message payload shape | Both serialization (sender side) and deserialization (handler side) updated |
| Content-script match list | Both `manifest-chrome.json` AND `manifest-firefox.json` updated |
| Add a video platform | Both the processor registry AND the manifest matches updated |
| Add a new CSP-restricted dependency | It's bundled by Vite, not loaded from a CDN |

## Anti-patterns

- **Don't** introduce `eval`, `new Function`, inline scripts, or CDN imports — MV3 CSP will block them.
- **Don't** rename a `ChromeMessageType` value without a full repo-wide grep for the old name.
- **Don't** update only one manifest template — Chrome and Firefox must stay in sync.
- **Don't** install `webextension-polyfill` — the project uses raw `chrome.*` deliberately.
- **Don't** throw uncaught errors in `background/` / `content/` — they vanish silently. Return an error payload.
