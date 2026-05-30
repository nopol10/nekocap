---
name: nekocap-runtime-cautions
description: Use when working on Next.js routing/middleware, error handling, Sentry/logging, user-facing notifications, performance-sensitive paths (Octopus subtitle renderer, large lists, history-state debouncing, React Compiler / memoization), or any change to caption parsing or the caption editor. Also load this when verifying a change since there are no automated tests.
---

This skill covers the runtime behaviors that don't fit cleanly elsewhere: routing, error handling, logging, performance hot-paths, and the project-specific gotchas that will silently bite agents who don't know about them.

## Routing (web)

- **File-based** under `pages/`. SSG with `getStaticProps` (often wrapped via `wrapper.getStaticProps()` from next-redux-wrapper) is the default; use `getServerSideProps` only when you genuinely need per-request data.
- **`middleware.ts`** handles `/browse` → `/browse/1`, Firebase auth rewrites under `/__/auth/*`, and YouTube Shorts / watch URL → `/create` redirects. If you add a new URL shortcut or platform deep link, update this file.
- `react-router-dom@5` is used **only inside the extension popup** — don't import it in web code.

## Error handling

- **User-facing notifications:** use antd's `message` API (`message.info`, `message.error`). The content script already wires `ChromeMessageType.InfoMessage` → `message.info(payload.message, payload.duration)`.
- **Saga errors:** wrap with `safe()` from `src/common/redux-utils.ts` (see the `nekocap-redux-feature` skill). Unwrapped sagas kill the entire saga middleware silently.
- **Web errors:** Sentry is configured via `sentry.client.config.js` / `sentry.server.config.js` and `NEXT_PUBLIC_SENTRY_DSN`.
- **Extension errors:** **no Sentry coverage.** Anything thrown in `background/`, `content/`, `popup/`, or `canvas-iframe/` only reaches the devtools console.
- **No global error boundary.** `react-error-boundary` is installed but unused. If you wrap a risky tree, do it locally; don't add a global boundary without a discussion.

## Logging

- `console.error` / `console.warn` / `console.log` used directly — no project logger utility.
- `redux-logger` is enabled in dev only (`process.env.PRODUCTION ? undefined : logger` in `src/common/store/store.tsx`). Don't enable it in production.
- No analytics (no Mixpanel, no GA). Don't add one without a discussion.

## Performance hot-paths

- **Octopus subtitle renderer** is isolated in a sandboxed iframe (`src/extension/content/canvas-iframe/` + `src/extension/content/containers/octopus-renderer-iframe-proxy.tsx`) to keep its workload off the host page's main thread. Anything you add that runs per subtitle frame must stay inside that iframe or be cheap enough to not affect playback.
- **YouTube history-state navigation** is debounced 1s in `src/extension/background/index.tsx` (~line 257). Reducing or removing the debounce causes double-injection.
- **Lists:** use `rc-virtual-list` or `react-virtualized` (both already installed) for anything over ~50 rows. Don't render thousands of subtitle entries unvirtualized.
- **Memoization:** the project relies on `babel-plugin-react-compiler` (React Compiler RC). Don't sprinkle `useMemo` / `useCallback` defensively — the compiler handles it. Add manual memoization only with a measured reason.

## Project-specific cautions — these will bite you

- **NO TEST COVERAGE EXISTS.** Vitest is wired up (`vitest.config.ts`) but the test suite is empty. `npm run test` passes because there's nothing to run. **Manual verification in a real browser is the only safety net.** After any change, load the unpacked extension on an actual video page (or run `npm run watch:web` for web changes), exercise the code path you touched, and watch the devtools console for errors. Don't trust "it builds" as proof of correctness.

- **Caption-editor mutations fail silently.** There's a `// TODO send error message to content script` at `src/common/feature/caption-editor/sagas.ts:304`. Failed validation or parsing does not surface a toast — the user sees nothing. When touching caption editing, watch the background console; don't trust the absence of an error message.

- **Persisted Redux state can poison users.** State is written to `chrome.storage.local` (see the `nekocap-redux-feature` skill). A bad shape ships to every existing user and stays there until they reset the extension. Migrations matter.

- **MV3 CSP forbids external scripts** — see the `nekocap-extension-messaging` skill if you're adding runtime dependencies.

## When you change X, also check Y

| If you change… | Also verify… |
|---|---|
| Caption parsing / Octopus rendering | Manually test ASS, SRT, and VTT — there are no tests |
| Caption-editor flow | Watch the background console for silent mutation errors |
| `middleware.ts` | The redirect chain still works for YouTube Shorts/watch links |
| Performance-sensitive code | Profile in devtools; React Compiler output may not match your assumptions |
| Any extension change | Tested in both Chrome AND Firefox unpacked builds |

## Anti-patterns

- **Don't** add `useMemo` / `useCallback` defensively. **Do** trust the React Compiler unless you've measured.
- **Don't** introduce a global error boundary unannounced.
- **Don't** add analytics, a custom logger, or a second notification system. Use `message` from antd.
- **Don't** rely on `npm run test` passing as a correctness signal — the suite is empty.
- **Don't** ship a Redux state shape change without a migration plan.
- **Don't** render >50 rows unvirtualized.
