import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Шляхи доступні без авторизації
const PUBLIC_PATHS = new Set(["/login", "/register", "/forgot-password"]);

// Шляхи що не потребують перевірки взагалі (статика, API auth)
function isSkipped(pathname: string): boolean {
  return (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/favicon")
  );
}

async function verifyToken(token: string): Promise<boolean> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Пропускаємо статику та auth API без будь-яких перевірок
  if (isSkipped(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get("token")?.value;

  // Публічна сторінка (login / register)
  if (PUBLIC_PATHS.has(pathname)) {
    // Якщо вже залогінений — редірект на dashboard
    if (token && (await verifyToken(token))) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Захищений роут — перевіряємо токен
  if (!token || !(await verifyToken(token))) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    const response = NextResponse.redirect(loginUrl);
    // Видаляємо протухлу cookie якщо була
    if (token) response.cookies.delete("token");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};