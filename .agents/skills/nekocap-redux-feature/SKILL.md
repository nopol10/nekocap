---
name: nekocap-redux-feature
description: Use when adding or modifying a Redux feature folder in the nekocap frontend — creating slices, writing sagas, defining selectors, changing persisted state shape, or touching redux-logger / reduxed-chrome-storage wiring.
---

This skill covers the Redux Toolkit + redux-saga conventions used in `src/common/feature/<name>/` and the rules around state that gets persisted to `chrome.storage.local`.

## Canonical feature-folder shape

Mirror `src/common/feature/login/` when adding a new feature. The expected files, in this order:

```
src/common/feature/<name>/
  action-types.ts    String constants for action types
  actions.ts         createAction / createSignal definitions
  reducers.ts        createReducer slice
  sagas.ts           takeLatest/takeEvery wired to actions
  selectors.ts       Reselect-style selectors
  types.ts           Local state shape + payload types
  utils.ts           (optional) feature-local helpers
  containers/        (optional) connected components
  api.ts             (optional) RTK Query endpoints — see nekocap-data-fetching skill
```

Don't invent a different layout. Don't merge files. Don't put the slice inline in a component.

## Always wrap sagas in `safe()`

`src/common/redux-utils.ts` exports `safe()`:

```ts
import { takeLatest } from "redux-saga/effects";
import { safe } from "@/common/redux-utils";

function* mySaga(action) { /* ... */ }
export default [takeLatest(myAction.REQUEST, safe(mySaga))];
```

An unwrapped saga that throws kills the entire saga middleware silently. `safe()` catches and logs via `console.error`. Every `takeLatest` / `takeEvery` registration goes through it.

## Selectors

Define selectors in `selectors.ts` with descriptive names (`loginSelector`, `userDataSelector`, `searchResultsSelector`). Import them by name in components:

```ts
const user = useSelector(userDataSelector);
```

Do not reach into `state.someSlice.x` directly in components or other sagas — that creates an untracked coupling that breaks silently when slice shape changes.

## Persisted state — handle with care

Redux state is persisted to `chrome.storage.local` via `reduxed-chrome-storage`. Store wiring is in `src/common/store/store.tsx`.

**Changing the shape of a persisted slice is a breaking change.** Existing users have old state in their browser storage. When you rename a field or change a type:

- Either add a migration in the persist config, or
- Accept that affected users will see their state reset (and confirm that's acceptable for the slice in question).

Some slices are intentionally cleared on extension startup (transient UI state). Before moving startup-clear logic, read `src/common/store/store.tsx` to understand which slices are expected to survive a reload and which aren't.

## redux-logger gate

`redux-logger` is enabled in dev only:

```ts
process.env.PRODUCTION ? undefined : logger
```

Don't enable it in production. Don't replace the gate with a different env check.

## When you change X, also check Y

| If you change… | Also verify… |
|---|---|
| Persisted slice shape | Migration added or user-state-reset accepted |
| Saga error handling | Still wrapped in `safe()` |
| Action types | All `takeLatest` / `takeEvery` registrations still match |
| Selectors | No component is reading `state.x` directly anymore |

## Anti-patterns specific to Redux features

- **Don't** write a saga without `safe()`.
- **Don't** invent a new feature-folder layout. Mirror `src/common/feature/login/`.
- **Don't** call Redux actions directly from a saga — use `put()` from `redux-saga/effects`.
- **Don't** access slice state directly in components. Use a selector.
- **Don't** change persisted shape without a migration plan.
