import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { canAccess, homeFor, type Role } from "@/lib/roles";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Before env is configured, don't gate anything (lets first-run dev work).
  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: { name: string; value: string; options: CookieOptions }[]
      ) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set({ name, value, ...options })
        );
      },
    },
  });

  // Refreshes the session and tells us who (if anyone) is signed in.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLogin = request.nextUrl.pathname === "/login";

  if (!user && !isLogin) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    return NextResponse.redirect(redirectUrl);
  }
  if (!user) return response; // on /login, signed out — fine.

  // Signed in: look up the role (tiny table, one indexed PK lookup).
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const role = (profile?.role ?? null) as Role | null;

  const path = request.nextUrl.pathname;
  const isNoAccess = path === "/no-access";

  const redirectTo = (pathname: string) => {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = pathname;
    return NextResponse.redirect(redirectUrl);
  };

  // Signed in on /login → send to the role's home section.
  if (isLogin) return redirectTo(homeFor(role));

  // No role assigned → only /no-access is allowed.
  if (!role && !isNoAccess) return redirectTo("/no-access");

  // Has a role but lingering on /no-access → send home.
  if (role && isNoAccess) return redirectTo(homeFor(role));

  // Gated section the role can't enter → send home.
  if (role && !canAccess(role, path)) return redirectTo(homeFor(role));

  return response;
}
