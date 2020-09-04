import { RootState } from "@/common/store/types";

export const publicDashboardSelector = (state: RootState) =>
  state.publicDashboard;
