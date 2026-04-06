import { NextResponse, NextRequest } from "next/server"

const isDevPreview = process.env.DEV_PREVIEW === "true" && process.env.NODE_ENV !== "production"

export function middleware(req: NextRequest) {
  if (isDevPreview && req.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
