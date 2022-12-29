import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const url = request.nextUrl.clone();
  url.pathname = "/browse/1";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/browse"],
};
