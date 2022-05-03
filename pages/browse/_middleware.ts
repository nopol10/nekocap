import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const url = request.nextUrl.clone();
  if (pathname == "/browse") {
    url.pathname = "/browse/1";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}
