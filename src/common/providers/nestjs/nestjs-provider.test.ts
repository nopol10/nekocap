import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LoginMethod, UserData } from "../backend-provider";
import type { ParseProvider } from "../parse/parse-provider";
import { createNestJsProvider } from "./nestjs-provider";

const API_URL = "https://api.example.com";

type FetchCall = { url: URL; init: RequestInit };

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/**
 * A stand-in for the Parse provider the NestJS provider falls back to
 */
const createBackup = (sessionToken?: string) => {
  const backup = {
    getSessionToken: vi.fn(async () => sessionToken),
    become: vi.fn(async () => undefined),
    // Mirrors how ParseProvider.login delegates to completeDeferredLogin
    login: vi.fn(async function (
      this: { completeDeferredLogin: (...args: unknown[]) => unknown },
      method: LoginMethod,
      options: { userData: UserData },
    ) {
      return this.completeDeferredLogin(method, options.userData, {
        id: options.userData.id,
        access_token: options.userData.idToken,
      });
    }),
    completeDeferredLogin: vi.fn(async () => {
      throw new Error("Parse login should not be used");
    }),
    logout: vi.fn(async () => undefined),
  };
  return backup;
};

describe("NestJsProvider", () => {
  let calls: FetchCall[];
  let responses: Response[];

  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_NEKOCAP_API_URL", API_URL);
    calls = [];
    responses = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string, init: RequestInit) => {
        calls.push({ url: new URL(input), init });
        const response = responses.shift();
        if (!response) {
          throw new Error(`Unexpected request to ${input}`);
        }
        return response;
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  const createProvider = (sessionToken?: string) => {
    const backup = createBackup(sessionToken);
    const provider = createNestJsProvider(backup as unknown as ParseProvider);
    return { backup, provider };
  };

  it("sends the session token of the logged in user", async () => {
    const { provider } = createProvider("r:session");
    responses.push(jsonResponse([]));

    await provider.loadCaptions({ videoId: "abc", videoSource: 0 });

    expect(calls[0].url.toString()).toBe(
      `${API_URL}/api/v1/captions?videoId=abc&videoSource=0`,
    );
    expect(calls[0].init.method).toBe("GET");
    expect(calls[0].init.headers).toMatchObject({
      Authorization: "Bearer r:session",
    });
  });

  it("sends no session token when logged out", async () => {
    const { provider } = createProvider(undefined);
    responses.push(jsonResponse({ status: "success", captions: [] }));

    await provider.loadPopularCaptions();

    expect(calls[0].init.headers).not.toHaveProperty("Authorization");
  });

  it("logs in through the NestJS API and keeps Parse's current user in sync", async () => {
    const { provider, backup } = createProvider();
    responses.push(
      jsonResponse({
        status: "success",
        sessionToken: "r:new",
        userId: "user1",
        isNewUser: true,
      }),
    );
    const userData: UserData = {
      id: "firebase-uid",
      username: "Neko",
      idToken: "id-token",
    };

    // Parse's login (not overridden) must call the NestJS completeDeferredLogin
    const result = await provider.login(LoginMethod.Firebase, {
      userData,
    });

    expect(backup.completeDeferredLogin).not.toHaveBeenCalled();
    expect(calls[0].url.pathname).toBe("/api/v1/auth/login");
    expect(calls[0].init.method).toBe("POST");
    expect(JSON.parse(calls[0].init.body as string)).toEqual({
      provider: "firebase",
      authData: { id: "firebase-uid", access_token: "id-token" },
    });
    expect(backup.become).toHaveBeenCalledWith("r:new");
    expect(result).toMatchObject({ sessionToken: "r:new", isNewUser: true });
  });

  it("fails the login when the server rejects the credentials", async () => {
    const { provider, backup } = createProvider();
    responses.push(
      jsonResponse({ status: "error", error: "Firebase auth is invalid" }),
    );

    await expect(
      provider.completeDeferredLogin(
        LoginMethod.Google,
        { id: "uid", username: "" },
        { id: "uid", access_token: "bad" },
      ),
    ).rejects.toThrow("Firebase auth is invalid");
    expect(backup.become).not.toHaveBeenCalled();
  });

  it("falls back to the Parse provider for methods it doesn't implement", async () => {
    const { provider, backup } = createProvider();
    await provider.logout();
    expect(backup.logout).toHaveBeenCalled();
  });

  it("maps a loaded caption to a caption container", async () => {
    const { provider } = createProvider("r:session");
    responses.push(
      jsonResponse({
        status: "success",
        caption: {
          objectId: "caption1",
          videoId: "video1",
          videoSource: "0",
          translatedTitle: "Title",
          content: JSON.stringify({ tracks: [] }),
          creatorId: "user1",
          language: "en",
          likes: 3,
          tags: ["audioDescribed"],
        },
        rawCaption: JSON.stringify({ type: "srt", data: "" }),
        rawCaptionUrl: "",
        userLike: true,
        userDislike: false,
        originalTitle: "Original",
        captionerName: "Neko",
      }),
    );

    const result = await provider.loadCaption({ captionId: "caption1" });

    expect(calls[0].url.pathname).toBe("/api/v1/captions/caption1");
    expect(result).toEqual({
      caption: {
        id: "caption1",
        loadedByUser: false,
        videoId: "video1",
        translatedTitle: "Title",
        originalTitle: "Original",
        videoSource: 0,
        data: { tracks: [] },
        creator: "user1",
        creatorName: "Neko",
        languageCode: "en",
        likes: 3,
        dislikes: 0,
        tags: ["audioDescribed"],
        userLike: true,
        userDislike: false,
      },
      userLike: true,
      userDislike: false,
      rawCaption: null,
    });
  });

  it("throws when a caption can't be loaded", async () => {
    const { provider } = createProvider();
    responses.push(
      jsonResponse({ status: "error", error: "Caption not found" }),
    );

    await expect(
      provider.loadCaption({ captionId: "missing" }),
    ).rejects.toThrow("Caption not found");
  });

  it("sends a captioner's caption filters as query parameters", async () => {
    const { provider } = createProvider();
    responses.push(
      jsonResponse({ status: "success", captions: [], hasMore: true }),
    );

    const result = await provider.loadUserCaptions({
      captionerId: "user 1",
      tags: ["g:a:#fff", "g:b:#000"],
      limit: 20,
      offset: 40,
      advancedFilter: "advanced",
      titleFilter: "neko",
    });

    const { url } = calls[0];
    expect(url.pathname).toBe("/api/v1/captioners/user%201/captions");
    expect(url.searchParams.getAll("tags")).toEqual(["g:a:#fff", "g:b:#000"]);
    expect(url.searchParams.get("limit")).toBe("20");
    expect(url.searchParams.get("offset")).toBe("40");
    expect(url.searchParams.get("advancedFilter")).toBe("advanced");
    expect(url.searchParams.get("titleFilter")).toBe("neko");
    expect(result).toEqual({ captions: [], hasMore: true });
  });

  it("uses the matching HTTP methods for updates", async () => {
    const { provider } = createProvider("r:session");
    responses.push(
      jsonResponse({ status: "success" }),
      jsonResponse({ status: "success" }),
      jsonResponse({ status: "success" }),
    );

    await provider.updateCaption({
      captionId: "caption1",
      privacy: 1,
      selectedTags: [],
    });
    await provider.deleteCaption("caption1");
    await provider.rejectCaption({ captionId: "caption1", reason: "Spam" });

    expect(calls.map(({ url, init }) => [init.method, url.pathname])).toEqual([
      ["PATCH", "/api/v1/captions/caption1"],
      ["DELETE", "/api/v1/captions/caption1"],
      ["POST", "/api/v1/captions/caption1/reject"],
    ]);
    expect(JSON.parse(calls[0].init.body as string)).toMatchObject({
      privacy: 1,
      selectedTags: [],
    });
    expect(JSON.parse(calls[2].init.body as string)).toEqual({
      reason: "Spam",
    });
  });

  it("returns submission errors instead of throwing", async () => {
    const { provider } = createProvider("r:session");
    responses.push(
      jsonResponse({ status: "error", error: "Invalid .ass/.ssa file" }),
    );

    const result = await provider.submitCaption({
      caption: {} as never,
      video: {} as never,
      hasAudioDescription: false,
    });

    expect(result).toEqual({
      status: "error",
      error: "Invalid .ass/.ssa file",
    });
  });
});
