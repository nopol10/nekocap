import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const pathName = request.nextUrl.pathname;
  if (pathName === "/browse") {
    const url = request.nextUrl.clone();
    url.pathname = "/browse/1";
    return NextResponse.redirect(url);
  } else if (pathName.startsWith("/__/auth")) {
    const finalUrl = `${process.env.FIREBASE_AUTH_BASE_URL || ""}${pathName}${
      request.nextUrl.search
    }`;
    return NextResponse.rewrite(new URL(finalUrl));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/browse", "/__/auth/(.*)"],
};
