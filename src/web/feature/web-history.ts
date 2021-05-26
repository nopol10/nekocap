import { isClient } from "@/common/client-utils";
import { createBrowserHistory } from "history";

export const webHistory = isClient() ? createBrowserHistory() : undefined;
