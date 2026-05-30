---
name: nekocap-data-fetching
description: Use when adding or modifying an API call, RTK Query endpoint, BackendProvider method, or any code that talks to the nekocap backend. Triggers on tasks like "add an endpoint", "fetch X from the server", "wire a mutation", or "expose a new BackendProvider method".
---

This skill covers how nekocap talks to its backend. All API access goes through the `BackendProvider` abstraction so the same code works in the Next.js web app and in the extension (where the actual request is proxied through the background script).

## The three layers

1. **`BackendProvider`** — `src/common/providers/backend-provider.ts`. Defines every backend method. The class is implemented for Parse + Firebase. Add new methods here first.
2. **RTK Query endpoints** — `src/common/store/api.ts` plus per-feature `src/common/feature/<name>/api.ts`. Exposes provider methods as hooks (`useGetFooQuery`, `useUpdateFooMutation`).
3. **Components** — consume the generated hooks. Never call `fetch` or `axios` directly.

## Adding a new endpoint (preferred path: RTK Query)

1. **Add the method to `BackendProvider`** in `src/common/providers/backend-provider.ts` and its Parse/Firebase implementations.
2. **Expose it via RTK Query** using the helpers in `src/common/store/api.ts`:

   ```ts
   // src/common/feature/<name>/api.ts
   import { nekocapApi } from "@/common/store/api";
   import { nekocapQueryMaker, nekocapMutationMaker } from "@/common/store/api";

   export const fooApi = nekocapApi.injectEndpoints({
     endpoints: (builder) => ({
       getFoo: nekocapQueryMaker(builder, "getFoo"),
       updateFoo: nekocapMutationMaker(builder, "updateFoo"),
     }),
   });

   export const { useGetFooQuery, useUpdateFooMutation } = fooApi;
   ```

   The `"getFoo"` string must match the `BackendProvider` method name exactly — the helpers are typed against `BackendProvider<RootState>`, so a typo will fail to compile.

3. **Use the generated hooks** in components.

## Why `BackendProvider`?

The extension's content script can't make arbitrary network requests directly under MV3 — they're proxied through the background service worker via `ChromeMessageType.ProviderRequest` (see `src/common/types.ts` and the `nekocap-extension-messaging` skill). Going through `BackendProvider` keeps that proxy transparent. Bypassing it with `fetch` / `axios` breaks the extension silently.

## Legacy direct async API calls

Files like `searchCaptionsApi` (in `src/common/feature/search/api.ts`) exist as plain async functions and predate RTK Query. They still work — don't rewrite them unprompted. **New code uses RTK Query.**

## TanStack React Query coexistence

`@tanstack/react-query` is also installed (used by `ServerReactQueryProvider` for some web-only flows). Don't add new React Query usage in shared code — prefer RTK Query so the call works inside the extension too.

## When you change X, also check Y

| If you change… | Also verify… |
|---|---|
| `BackendProvider` method signature | All RTK Query endpoints referencing it (generics may mislead — check at the call site) |
| A method's return type | Components consuming the hook still typecheck |
| Add a method | Both Parse and Firebase implementations added (or one is intentionally a stub) |

## Anti-patterns

- **Don't** call `fetch` / `axios` / raw `Parse.Cloud.run` directly from a component. **Do** route through `BackendProvider` + RTK Query.
- **Don't** add a method to a provider implementation without adding it to the abstract `BackendProvider` first.
- **Don't** use TanStack React Query for new shared code — use RTK Query.
- **Don't** rename the `BackendProvider` method without renaming the matching `nekocapQueryMaker(builder, "name")` string.
