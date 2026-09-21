import {
  AdvancedFilter,
  CaptionerFields,
} from "@/common/feature/captioner/types";
import { act, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockRouter = {
  query: {} as Record<string, string | string[]>,
  isReady: true,
  push: vi.fn(),
};

vi.mock("next/router", () => ({
  useRouter: () => mockRouter,
}));

vi.mock("next-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("@/hooks", () => ({
  useIsClient: () => true,
}));

vi.mock("./profile-sidebar", () => ({
  ProfileSidebar: () => <div data-testid="profile-sidebar" />,
}));

vi.mock("../../common/components/caption-list", () => ({
  CAPTION_LIST_PAGE_SIZE: 20,
  CaptionList: () => <div data-testid="caption-list" />,
}));

// Imported after the mocks so that they apply
import { Profile } from "./profile";

const CAPTIONER: CaptionerFields = {
  userId: "captioner-1",
  name: "Nyan",
  nameTag: 1234,
  recs: 0,
  languageCodes: [],
  verified: false,
  banned: false,
  lastSubmissionTime: 0,
  profileMessage: "",
  donationLink: "",
  captionCount: 100,
  isReviewer: false,
  isReviewerManager: false,
  isAdmin: false,
  captionTags: [],
};

type SetFiltersMock = ReturnType<typeof createSetFiltersMock>;

const createSetFiltersMock = () =>
  vi.fn<
    (
      tags: string[],
      advancedFilter: AdvancedFilter,
      titleFilter: string,
    ) => void
  >();

const renderProfile = (onSetFilters: SetFiltersMock) => {
  return render(
    <Profile
      captioner={CAPTIONER}
      captions={[]}
      currentCaptionPage={1}
      hasMore={false}
      onAssignReviewer={vi.fn()}
      onAssignReviewerManager={vi.fn()}
      onBanCaptioner={vi.fn()}
      onVerifyCaptioner={vi.fn()}
      onSetFilters={onSetFilters}
      onUpdateCaption={vi.fn()}
    />,
  );
};

const getTitleFilterInput = () =>
  screen.getByPlaceholderText("profile.filterByTitle") as HTMLInputElement;

const typeInTitleFilter = (value: string) => {
  fireEvent.change(getTitleFilterInput(), { target: { value } });
};

const runDebounce = () => {
  act(() => {
    vi.advanceTimersByTime(1000);
  });
};

describe("Profile video title filter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockRouter.query = {};
    window.history.pushState({}, "", "/capper/captioner-1");
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("only requests captions once the user stops typing", () => {
    const onSetFilters = createSetFiltersMock();
    renderProfile(onSetFilters);

    typeInTitleFilter("s");
    typeInTitleFilter("sp");
    typeInTitleFilter("spy");
    expect(onSetFilters).not.toHaveBeenCalled();

    runDebounce();

    expect(onSetFilters).toHaveBeenCalledTimes(1);
    expect(onSetFilters).toHaveBeenCalledWith([], "all", "spy");
  });

  it("puts the applied filter in the url so it can be shared", () => {
    renderProfile(createSetFiltersMock());

    typeInTitleFilter("spy x family");
    runDebounce();

    expect(new URL(window.location.href).searchParams.get("title")).toBe(
      "spy x family",
    );
  });

  it("does not refetch when the debounced filter ends up unchanged", () => {
    const onSetFilters = createSetFiltersMock();
    renderProfile(onSetFilters);

    typeInTitleFilter("spy");
    typeInTitleFilter("");
    runDebounce();

    expect(onSetFilters).not.toHaveBeenCalled();
  });

  it("keeps the other filters when the title filter changes", () => {
    const onSetFilters = createSetFiltersMock();
    mockRouter.query = { advanced: "advanced" };
    renderProfile(onSetFilters);

    expect(onSetFilters).toHaveBeenCalledWith([], "advanced", "");
    onSetFilters.mockClear();

    typeInTitleFilter("spy");
    runDebounce();

    expect(onSetFilters).toHaveBeenCalledWith([], "advanced", "spy");
  });

  it("applies a title filter from the url on load", () => {
    const onSetFilters = createSetFiltersMock();
    mockRouter.query = { title: "  spy  " };
    renderProfile(onSetFilters);

    expect(onSetFilters).toHaveBeenCalledTimes(1);
    expect(onSetFilters).toHaveBeenCalledWith([], "all", "spy");
    expect(getTitleFilterInput().value).toBe("spy");
  });

  it("clears the filter when the input is emptied", () => {
    const onSetFilters = createSetFiltersMock();
    mockRouter.query = { title: "spy" };
    renderProfile(onSetFilters);
    onSetFilters.mockClear();

    typeInTitleFilter("");
    runDebounce();

    expect(onSetFilters).toHaveBeenCalledWith([], "all", "");
    expect(new URL(window.location.href).searchParams.get("title")).toBeNull();
  });
});
