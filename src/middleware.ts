import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(_request: NextRequest) {
  // Let client-side layout guards handle authorization with fresh backend API verification
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
