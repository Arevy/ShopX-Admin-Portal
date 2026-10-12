import { NextRequest, NextResponse } from "next/server";

// This project uses custom page extensions; middleware lives alongside src/pages.
// Tenant mode passes through, preserving the existing support-session guards.
export function middleware(request: NextRequest) {
	if (process.env.SHOPX_ADMIN_MODE !== "control") return NextResponse.next();
	const path = request.nextUrl.pathname;
	if (path === "/" || path === "/login")
		return NextResponse.redirect(new URL("/platforms", request.url));
	if (
		path === "/platforms" ||
		path.startsWith("/api/control/") ||
		path === "/api/platform-config" ||
		path.startsWith("/_next/") ||
		path === "/favicon.ico"
	) {
		const response = NextResponse.next();
		response.headers.set("Referrer-Policy", "no-referrer");
		response.headers.set("X-Frame-Options", "DENY");
		response.headers.set(
			"Content-Security-Policy",
			"frame-ancestors 'none'; object-src 'none'; base-uri 'self'"
		);
		return response;
	}
	return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
}
export const config = { matcher: ["/((?!_next/static|_next/image).*)"] };
