import React, { useContext } from "react";

export const ThemeContext = React.createContext({
  isDarkMode: false,
});
export const ThemeProvider = ThemeContext.Provider;
export const useAppTheme = () => useContext(ThemeContext);
