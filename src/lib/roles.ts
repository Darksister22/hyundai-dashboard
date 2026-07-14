// =====================================================================
// Roles & section access — single source of truth.
// Used by the middleware (route gate) and the sidebar (nav filtering).
// Mirrors supabase/migrations/0007_roles.sql — keep the two in sync.
// =====================================================================

export type Role = "admin" | "manager" | "support";

/** Which roles may enter each dashboard section (by route prefix). */
const SECTIONS: { prefix: string; roles: Role[] }[] = [
  { prefix: "/cars", roles: ["admin", "manager"] },
  { prefix: "/hero-banners", roles: ["admin", "manager"] },
  { prefix: "/find-us", roles: ["admin", "manager"] },
  { prefix: "/contact", roles: ["admin", "support"] },
];

function sectionFor(pathname: string) {
  return SECTIONS.find(
    (s) => pathname === s.prefix || pathname.startsWith(s.prefix + "/")
  );
}

/**
 * Can this role open this path? Paths outside the gated sections
 * (e.g. /login, /no-access) return true — they're handled separately.
 */
export function canAccess(role: Role | null, pathname: string): boolean {
  const section = sectionFor(pathname);
  if (!section) return true;
  return role !== null && section.roles.includes(role);
}

/** Landing page after login / after being bounced from a gated section. */
export function homeFor(role: Role | null): string {
  if (role === "support") return "/contact";
  if (role === "admin" || role === "manager") return "/cars";
  return "/no-access";
}
