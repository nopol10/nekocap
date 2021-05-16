import { RootState } from "@/common/store/types";
import { createAction } from "@reduxjs/toolkit";
import { HYDRATE } from "next-redux-wrapper";

export const hydrate = createAction<RootState>(HYDRATE);
