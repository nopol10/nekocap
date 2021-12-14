import React, { useReducer } from "react";

export type PopupState = Record<string, never>;

export type PopupActions = { type: "" };

export const PopupContext = React.createContext<
  [PopupState, React.Dispatch<PopupActions>]
>(null);

const reducer = (state: PopupState, action: PopupActions) => {
  return state;
};

export const PopupProvider = ({ children }: { children: React.ReactNode }) => {
  const [globalState, dispatch] = useReducer(reducer, {});
  return (
    <PopupContext.Provider value={[globalState, dispatch]}>
      {children}
    </PopupContext.Provider>
  );
};
