# nekocap frontend — agent guide

This file is the always-loaded baseline: stack, layout, naming, styling, and cross-cutting anti-patterns. Task-specific guidance (Redux features, data fetching, forms, i18n, extension messaging, runtime cautions) lives in skills under `.agents/skills/` and is loaded by the harness on demand — do not duplicate that content here.

## 1. Repo at a glance

nekocap is a **dual-target frontend**:

- **Browser extension** (Chrome + Firefox, Manifest V3) — entry points in `src/extension/{background,content,popup,content/canvas-iframe}`.
- **Next.js 14 web app** (nekocap.com) — entry points in `pages/` and `src/web/`.

Both targets share a large body of code under `src/common/` (Redux features, providers, UI primitives, types). When you touch shared code, you are changing both targets at once — verify both still work.

## 2. Tech stack & versions

| Area | Library | Version |
|---|---|---|
| UI | React | 18.3 |
| Web | Next.js | 14.2 |
| Component library | Ant Design | 5.29 |
| Styling | styled-components | 6.1 |
| State | Redux Toolkit + redux-saga | 1.8.5 / 1.1.3 |
| Data fetching | RTK Query + TanStack React Query | 1.8.5 / 5.80 |
| Forms | react-hook-form | 7.52 |
| i18n | next-i18next + react-i18next | 15.3 / 15 |
| Rich text | Lexical | 0.44 |
| Auth | Firebase | 10.13 |
| Backend SDK | Parse | 8.5 |
| Ext build | Vite | 6.4 |
| Web build | Next | 14.2 |
| Tests | Vitest + Testing Library | 4.1 / 16.3 |
| Error reporting | Sentry (web only) | 10.29 |
| Persisted store | reduxed-chrome-storage | 3.0.10 |

Do not introduce a parallel solution for any of the above (e.g. don't add Zustand, don't add Formik, don't add Tailwind). Use what's already here.

## 3. Folder map

```
pages/                       Next.js routes — file-based
public/locales/<lang>/       i18n message files (common.json)
extension-statics/           Manifest templates, extension _locales, icons
src/
  common/                    SHARED between extension and web
    components/              WS* wrapper components (ws-button.tsx, ws-layout.tsx…)
    feature/<name>/          Redux feature folders (login, search, captions…)
    providers/               BackendProvider abstraction (Parse + Firebase)
    store/                   Root store, RTK Query api, types
    hooks/                   Shared hooks (useDarkMode…)
    colors.ts                Color tokens — import, never hardcode
    style-constants.ts       DEVICE media queries
    redux-utils.ts           safe() saga wrapper
    types.ts                 ChromeMessageType + cross-process message types
  extension/
    background/              MV3 service worker — auth, message hub
    content/                 Injected into video sites; UI + caption rendering
    content/canvas-iframe/   Sandboxed iframe for Octopus subtitle rendering
    popup/                   Toolbar popup UI (react-router-dom inside)
    common/                  Extension-only helpers
  web/
    feature/<name>/          Web-only feature UIs (dashboard, profile…)
    store/                   Web-specific store wiring
    styles/                  Global SCSS (web only)
build-extension.ts           Vite orchestrator (background/content/popup/iframe)
next.config.js               i18n, SVG via @svgr/webpack, Sentry, antd-less
vitest.config.ts             Tests (jsdom)
.agents/skills/              Task-specific guidance loaded on demand by the harness
```

## 4. Build, dev, and test commands

| Goal | Command |
|---|---|
| Develop extension (Chrome) + web concurrently | `npm run watch:chrome` |
| Develop extension (Firefox) + web | `npm run watch:firefox` |
| Build everything (prod) | `npm run build` |
| Build Chrome extension only | `npm run build:ext:chrome` |
| Build Firefox extension only | `npm run build:ext:firefox` |
| Build web only | `npm run build:web` |
| Start web prod server | `npm run start:web:prod` |
| Run tests | `npm run test` (vitest run) |
| Lint | `npm run lint` / `npm run lint:fix` |
| Bundle analysis | `npm run analyze:ext` / `npm run analyze:web` |

Pre-commit hook (husky + lint-staged) runs `prettier --write` then `eslint --cache --fix` on staged `.ts/.tsx`. Don't bypass it.

## 5. TypeScript & lint conventions

- `tsconfig.json`: `strict: false` overall, **but `strictNullChecks: true`** — null/undefined safety is enforced; the rest of strict is not.
- Path alias: `@/*` resolves to `src/*`. Prefer `@/common/...` over deep relative paths (`../../../`).
- ESLint: `@typescript-eslint/recommended` + `react/recommended` + `react-hooks/recommended-legacy` + prettier. `@typescript-eslint/ban-ts-comment` is OFF, so `// @ts-ignore` is allowed but should be rare and explained.
- Prettier formats everything — never argue with it, never disable it.
- Filenames: **kebab-case** (`ws-button.tsx`, `caption-card.tsx`). Components inside: **PascalCase**.

## 6. Component conventions

- **Function components only.** No class components.
- **Named exports** for components in `src/common/components/` and `src/{extension,web}/feature/`. Next.js pages under `pages/` use `export default` (Next requirement) — do not change that.
- Props typed as a `type` alias next to the component, suffixed `Props`:
  ```ts
  type CaptionCardProps = { caption: Caption; onClick: () => void };
  export const CaptionCard = ({ caption, onClick }: CaptionCardProps) => { ... };
  ```
- **Prefer `WS*` wrappers over raw antd.** Existing wrappers (see `src/common/components/`): `WSButton`, `WSLayout`, `WSHeader`, `WSText`, `WSTitle`, `WSSelect`, `WSSpace`, `WSTag`, `WSCaptionTag`, `WSLinkButton`, `WSMarkdown`. If you find yourself styling a raw antd component the same way twice, create a new `ws-*.tsx` wrapper.
- Components live next to the feature that owns them (`src/web/feature/home/components/...`). Only promote to `src/common/components/` when used by two or more features.

## 7. Styling

- **styled-components is the default.** No new CSS or SCSS files — the existing global SCSS in `src/web/styles/` is legacy.
- **Colors:** import from `src/common/colors.ts`. Do not hardcode hex values.
- **Media queries:** use the `DEVICE` constants in `src/common/style-constants.ts`:
  ```ts
  import { DEVICE } from "@/common/style-constants";
  const Wrapper = styled.div`
    padding: 8px;
    @media ${DEVICE.tablet} { padding: 16px; }
  `;
  ```
  Breakpoints available: `mobileSmall` (320), `mobileMedium` (375), `mobileLarge` (425), `tablet` (768), `mobileOnly` (≤425), `desktop` (1024), `largeDesktop` (1680).
- **Dark mode:** use `useDarkMode()` (hook) or `darkModeSelector()` (in styled-component template literals). Antd theming is set up via `ConfigProvider` in `pages/_app.tsx` — don't add a second theme system.
- When wrapping antd: ``styled(Button)`...` `` — keep the wrapper in a `ws-*.tsx` file.

## 8. Cross-cutting anti-patterns

1. **Don't** hardcode colors. **Do** import from `src/common/colors.ts`.
2. **Don't** import raw antd `Button` / `Layout` / `Text` / `Tag` if a `WS*` wrapper exists. **Do** use `WSButton`, `WSLayout`, etc.
3. **Don't** add a new CSS or SCSS file. **Do** use styled-components co-located with the component.
4. **Don't** use deep relative imports (`../../../common/...`). **Do** use the `@/common/...` alias.
5. **Don't** add a new state library, form library, fetch library, or styling library. **Do** use what's listed in §2.
6. **Don't** invent a new layout for a Redux feature, form pattern, or message type — load the matching skill from `.agents/skills/` and follow it.

## 9. Useful file index — read these to get oriented

- `package.json` — scripts and the canonical dependency list
- `tsconfig.json` — `@/*` alias, strictNullChecks
- `next.config.js` — i18n, SVG, Sentry, antd-less setup
- `build-extension.ts` — Vite orchestration for the four extension bundles
- `extension-statics/manifest-chrome.json` — MV3 template; content-script match list lives here
- `pages/_app.tsx` — Redux + antd ConfigProvider + i18n wiring for the web app
- `src/common/types.ts` — `ChromeMessageType` and cross-process message shapes
- `src/common/redux-utils.ts` — `safe()` saga wrapper
- `src/common/colors.ts` — color tokens
- `src/common/style-constants.ts` — `DEVICE` media queries
- `src/common/store/store.tsx` — Redux store, persist config, redux-logger gate
- `src/common/store/api.ts` — `nekocapApi`, `nekocapQueryMaker`, `nekocapMutationMaker`
- `src/common/providers/backend-provider.ts` — API abstraction (Parse + Firebase)
- `src/common/feature/login/{action-types,actions,reducers,sagas,selectors,types}.ts` — canonical feature folder
- `src/common/components/ws-button.tsx` / `ws-layout.tsx` — the WS\* wrapper pattern
- `src/common/feature/video/utils.ts` — video platform / processor registry
- `src/extension/background/index.tsx` — MV3 service worker, message hub, auth
- `src/extension/content/index.tsx` — content script entry, platform detection
- `src/extension/popup/index.tsx` — popup UI entry, react-router
- `next-i18next.config.js` + `public/locales/en/common.json` — translation setup
- `middleware.ts` — Next.js redirects and rewrites
