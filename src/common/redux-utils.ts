import { call } from "redux-saga/effects";

export const safe = (saga: (...args: any) => any, ...args: any[]) =>
  function* (action?: any) {
    try {
      yield call(saga, ...args, action);
    } catch (err) {
      console.error("[Saga Error] ", err);
    }
  };
