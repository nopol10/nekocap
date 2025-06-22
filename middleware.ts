import { VideoSource } from "@/common/feature/video/types";
import { NextURL } from "next/dist/server/web/next-url";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const pathName = request.nextUrl.pathname;
  if (pathName === "/browse") {
    return redirectToBrowsePage(request);
  } else if (pathName.startsWith("/__/auth")) {
    return rewriteFirebaseAuthUrl(request);
  } else if (pathName.startsWith("/shorts/")) {
    return redirectYoutubeShortsToCreatePage(request);
  } else if (pathName === "/watch") {
    return redirectYoutubeWatchToCreatePage(request);
  }
  return NextResponse.next();
}

function redirectToBrowsePage(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/browse/1";
  return NextResponse.redirect(url);
}

function rewriteFirebaseAuthUrl(request: NextRequest) {
  const pathName = request.nextUrl.pathname;
  const finalUrl = `${process.env.FIREBASE_AUTH_BASE_URL || ""}${pathName}${
    request.nextUrl.search
  }`;
  return NextResponse.rewrite(new URL(finalUrl));
}

function redirectYoutubeShortsToCreatePage(request: NextRequest) {
  const url = new URL(
    request.nextUrl.protocol + "//" + request.nextUrl.host + "/create",
  );
  url.searchParams.set("videoId", request.nextUrl.pathname.split("/")[2]);
  url.searchParams.set("videoSource", VideoSource.NekoCapYoutube.toString());
  const newUrl = new NextURL(url);
  return NextResponse.redirect(newUrl);
}

function redirectYoutubeWatchToCreatePage(request: NextRequest) {
  const url = new URL(
    request.nextUrl.protocol + "//" + request.nextUrl.host + "/create",
  );
  url.searchParams.set("videoId", request.nextUrl.searchParams.get("v") || "");
  url.searchParams.set("videoSource", VideoSource.NekoCapYoutube.toString());
  const newUrl = new NextURL(url);
  return NextResponse.redirect(newUrl);
}

export const config = {
  matcher: ["/browse", "/__/auth/(.*)", "/watch", "/shorts/(.*)"],
};
