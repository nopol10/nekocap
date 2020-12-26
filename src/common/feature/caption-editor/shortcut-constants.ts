import { EditorShortcuts, EDITOR_KEYS, ShortcutList } from "./types";

const DEFAULT_SHORTCUTS: EditorShortcuts = {
  SAVE: "ctrl+s",
  PLAY_PAUSE: "shift+space",
  GO_TO_PREVIOUS_CAPTION: "ctrl+up",
  GO_TO_NEXT_CAPTION: "ctrl+down",
  SEEK_BACK_500_MS: "alt+left",
  SEEK_FORWARD_500_MS: "alt+right",
  SEEK_BACK_5_SECONDS: "shift+left",
  SEEK_FORWARD_5_SECONDS: "shift+right",
  UNDO: "ctrl+z",
  REDO: ["ctrl+y", "ctrl+shift+z"],
  SET_START_TO_CURRENT_TIME: "alt+[",
  SET_END_TO_CURRENT_TIME: "alt+]",
  NEW_CAPTION: "enter",
};

const YOUTUBE_EDITOR_SHORTCUTS: EditorShortcuts = {
  ...DEFAULT_SHORTCUTS,
  PLAY_PAUSE: "shift+space",
  GO_TO_PREVIOUS_CAPTION: "ctrl+up",
  GO_TO_NEXT_CAPTION: "ctrl+down",
  SEEK_BACK_5_SECONDS: "shift+left",
  SEEK_FORWARD_5_SECONDS: "shift+right",
  UNDO: "ctrl+z",
  REDO: "ctrl+y",
};

const AMARA_EDITOR_SHORTCUTS: EditorShortcuts = {
  ...DEFAULT_SHORTCUTS,
  PLAY_PAUSE: "tab",
  GO_TO_PREVIOUS_CAPTION: "alt+up",
  GO_TO_NEXT_CAPTION: "alt+down",
  SEEK_BACK_5_SECONDS: "ctrl+shift+,",
  SEEK_FORWARD_5_SECONDS: "ctrl+shift+.",
  UNDO: "ctrl+z",
  REDO: ["ctrl+y", "ctrl+shift+z"],
};

const AEGISUB_EDITOR_SHORTCUTS: EditorShortcuts = {
  ...DEFAULT_SHORTCUTS,
  PLAY_PAUSE: "ctrl+p",
  GO_TO_PREVIOUS_CAPTION: "alt+2", // Should be ctrl+2 but chrome prevents that shortcut from working, same for the next caption shortcut
  GO_TO_NEXT_CAPTION: "alt+8",
  REDO: "ctrl+y",
};

// Names are defined separately from the editor shortcut objects so I don't have to rewrite the same name for each set of definitions
export const SHORTCUT_NAME: { [id in keyof typeof EDITOR_KEYS] } = {
  SAVE: "Save",
  PLAY_PAUSE: "Play",
  GO_TO_PREVIOUS_CAPTION: "Previous Caption",
  GO_TO_NEXT_CAPTION: "Next Caption",
  NEW_CAPTION: "Insert new caption",
  SEEK_BACK_500_MS: "Go back 500 ms",
  SEEK_FORWARD_500_MS: "Go forward 500 ms",
  SEEK_BACK_5_SECONDS: "Go back 5 seconds",
  SEEK_FORWARD_5_SECONDS: "Go forward 5 seconds",
  UNDO: "Undo",
  REDO: "Redo",
  SET_START_TO_CURRENT_TIME: "Set start of the selected cue to current time",
  SET_END_TO_CURRENT_TIME: "Set end of the selected cue to current time",
};

export const BUILT_IN_SHORTCUTS: ShortcutList = {
  NekoCap: DEFAULT_SHORTCUTS,
  Youtube: YOUTUBE_EDITOR_SHORTCUTS,
  Aegisub: AEGISUB_EDITOR_SHORTCUTS,
  Amara: AMARA_EDITOR_SHORTCUTS,
};
