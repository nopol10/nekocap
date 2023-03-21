import {
  ActionReducerMapBuilder,
  createAction,
  PayloadAction,
} from "@reduxjs/toolkit";
import { call, put } from "redux-saga/effects";
import { TabbedType } from "../types";

export type ThunkedPayloadAction<T, S extends string = string> = PayloadAction<
  T,
  S,
  { thunk: boolean }
>;

type Catch = {
  catch: (...params: any) => void;
};

export const createSignalActionInState =
  (stateKey: string, tabbed = false) =>
  <R = void, S = void, F = void>(actionType: string) => {
    return createSignalAction<R, S, F>(actionType, stateKey, tabbed);
  };

type ErrorType = Partial<TabbedType> & {
  error: string;
};

// Type of value returned from a signal action's request saga. Returning this is optional
export type SignalActionRequestResultMeta = {
  skip?: boolean; // True to skip automatic setting of the meta property in the LOAD_END action
  payload: any;
};

export const createSignalAction = <R = void, S = void, F = void>(
  actionType: string,
  stateKey = "",
  tabbed = false
) => {
  const requestType = `SIGNAL/${actionType}/REQUEST`;
  const successType = `SIGNAL/${actionType}/SUCCESS`;
  const failureType = `SIGNAL/${actionType}/FAILURE`;
  const loadStartType = `SIGNAL/${actionType}/LOAD_START`;
  const loadEndType = `SIGNAL/${actionType}/LOAD_END`;
  const setErrorType = `SIGNAL/${actionType}/SET_ERROR`;
  const clearErrorType = `SIGNAL/${actionType}/CLEAR_ERROR`;
  const requestActionCreator = createThunkedActionCreator<R>(requestType);
  const successActionCreator = createThunkedActionCreator<S>(successType);
  const failureActionCreator = createThunkedActionCreator<F>(failureType);

  const loadStartCreator = createAction<TabbedType | undefined>(loadStartType);
  const loadEndCreator = createAction<TabbedType | undefined>(loadEndType);

  const setErrorCreator = tabbed
    ? createAction<ErrorType | undefined>(setErrorType)
    : createAction(setErrorType);
  const clearErrorCreator = createAction<TabbedType | undefined>(
    clearErrorType
  );

  const loadKey = `${actionType}Load`;
  const errorKey = `${actionType}Error`;
  return {
    REQUEST: requestType,
    SUCCESS: successType,
    FAILURE: failureType,
    LOAD_START: loadStartType,
    LOAD_END: loadEndType,
    LOAD_KEY: loadKey,
    ERROR: setErrorType,
    ERROR_KEY: errorKey,
    CLEAR_ERROR: clearErrorType,
    request: requestActionCreator,
    success: successActionCreator,
    failure: failureActionCreator,
    augmentReducer: <T>(
      builder: ActionReducerMapBuilder<T>,
      isTabbedOverride: boolean | undefined = undefined
    ) => {
      const isTabbed =
        isTabbedOverride !== undefined ? isTabbedOverride : tabbed;
      builder.addCase(loadStartCreator, (state: any, action) => {
        if (!state) {
          return state;
        }
        if (isTabbed) {
          const { payload } = action as PayloadAction<TabbedType>;
          const { tabId } = payload;
          const defaultState = { [loadKey]: true };
          const currentTab = state.tabMeta
            ? state.tabMeta[tabId] || defaultState
            : defaultState;
          return {
            ...state,
            tabMeta: {
              ...state.tabMeta,
              [tabId]: {
                ...currentTab,
                [loadKey]: true,
              },
            },
          };
        }
        return {
          ...state,
          [loadKey]: true,
        };
      });
      builder.addCase(loadEndCreator, (state: any, action) => {
        if (!state) {
          return state;
        }
        if (isTabbed) {
          const { payload } = action as PayloadAction<TabbedType>;
          const { tabId } = payload;
          const defaultState = { [loadKey]: false };
          const currentTab = state.tabMeta
            ? state.tabMeta[tabId] || defaultState
            : defaultState;
          return {
            ...state,
            tabMeta: {
              ...state.tabMeta,
              [tabId]: {
                ...currentTab,
                [loadKey]: false,
              },
            },
          };
        }
        return {
          ...state,
          [loadKey]: false,
        };
      });
      builder.addCase(setErrorCreator, (state: any, action) => {
        if (!state || !action.payload) {
          return state;
        }
        const { tabId, error } = action.payload;
        if (isTabbed && tabId) {
          const defaultState = { [errorKey]: error };
          const currentTab = state.tabMeta
            ? state.tabMeta[tabId] || defaultState
            : defaultState;

          return {
            ...state,
            tabMeta: {
              ...state.tabMeta,
              [tabId]: {
                ...currentTab,
                [errorKey]: error,
              },
            },
          };
        }
        return {
          ...state,
          [errorKey]: error,
        };
      });
      builder.addCase(clearErrorCreator, (state: any, action) => {
        if (!state) {
          return state;
        }
        if (isTabbed) {
          const { payload } = action as PayloadAction<TabbedType>;
          const { tabId } = payload;

          const defaultState = { [errorKey]: undefined };
          const currentTab = state.tabMeta
            ? state.tabMeta[tabId] || defaultState
            : defaultState;

          return {
            ...state,
            tabMeta: {
              ...state.tabMeta,
              [tabId]: {
                ...currentTab,
                [errorKey]: undefined,
              },
            },
          };
        }
        return {
          ...state,
          [errorKey]: undefined,
        };
      });
      return builder;
    },
    isLoading:
      (tabId: number | undefined) =>
      (state): boolean => {
        if (tabbed && tabId) {
          if (!state[stateKey].tabMeta || !state[stateKey].tabMeta[tabId]) {
            return false;
          }
          return state[stateKey].tabMeta[tabId][loadKey] === true;
        }
        return state[stateKey][loadKey] === true;
      },
    error:
      (tabId: number | undefined) =>
      (state): string | undefined => {
        if (tabbed && tabId) {
          if (!state[stateKey].tabMeta || !state[stateKey].tabMeta[tabId]) {
            return undefined;
          }
          return state[stateKey].tabMeta[tabId][errorKey];
        }
        return state[stateKey][errorKey];
      },
    requestSaga: (worker: (action: ThunkedPayloadAction<R>) => any) =>
      function* (action: ThunkedPayloadAction<R>) {
        const { meta } = action;
        let payload: { tabId: number } | undefined = undefined;
        if (tabbed) {
          const incomingPayload = action.payload as unknown as TabbedType;
          payload = { tabId: incomingPayload.tabId };
        }
        try {
          yield put(clearErrorCreator(payload));
          yield put(loadStartCreator(payload));
          const result: SignalActionRequestResultMeta = yield call(
            worker,
            action
          );
          if (!result || (result && !result.skip)) {
            // Even though we add properties to the payload with the meta for redux-saga-thunk,
            // the values are not sent to the content script's "then" probably due to webext-redux
            const promiseAction = loadEndCreator(payload);
            promiseAction.payload = {
              ...promiseAction.payload,
              ...result?.payload,
            };
            yield put({ ...promiseAction, meta });
          }
        } catch (error) {
          const errorPayload: ErrorType = { error: error.message };
          if (tabbed) {
            const incomingPayload = action.payload as unknown as TabbedType;
            errorPayload.tabId = incomingPayload.tabId;
          }
          yield put(setErrorCreator(errorPayload));
          yield put({ ...failureActionCreator(error), meta, error: true });
          yield put(loadEndCreator(payload));
        }
      },
  };
};

export function createThunkedAction<T>(action: PayloadAction<T, string>) {
  // @ts-ignore
  const meta = action.meta ? { ...action.meta } : {};
  const value = {
    ...action,
    meta: {
      ...meta,
      thunk: true,
    },
  };
  return value;
}

type ThunkedAction<T> = {
  payload: T;
  type: string;
  meta: { thunk: boolean };
  then: (param: (...params: any) => void) => Catch;
  catch: (param: (...params: any) => void) => void;
};

interface ThunkedActionCreator<T> {
  type: string;
  (payload: T): ThunkedAction<T>;
}

export const createThunkedActionCreator = <T>(type: string) => {
  const actionCreator = function (params: T) {
    return createThunkedAction(createAction<T>(type)(params));
  } as ThunkedActionCreator<T>;
  actionCreator.type = type;
  return actionCreator;
};
