"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Car,
  GalleryHorizontalEnd,
  MapPin,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "./ThemeToggle";

const NAV = [
  { href: "/cars", label: "Cars", icon: Car },
  { href: "/hero-banners", label: "Hero banners", icon: GalleryHorizontalEnd },
  { href: "/find-us", label: "Find us", icon: MapPin },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="sticky top-0 flex h-dvh w-60 shrink-0 self-start flex-col bg-[var(--color-navy-900)] text-white/90">
      {/* Brand */}
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-white/10 px-5">
        <span className="grid size-7 place-items-center rounded-[var(--radius-sm)] bg-white font-bold text-[var(--color-navy)]">
          H
        </span>
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-wide text-white">
            HYUNDAI IRAQ
          </div>
          <div className="text-[11px] text-white/55">Content dashboard</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-white/10 text-white"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              )}
            >
              <span
                className={cn(
                  "absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-[var(--color-sky)] transition-opacity",
                  active ? "opacity-100" : "opacity-0"
                )}
              />
              <Icon className="size-[18px] shrink-0" strokeWidth={2} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <ThemeToggle />
        <button
          type="button"
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut className="size-[18px] shrink-0" strokeWidth={2} />
          Sign out
        </button>
        <div className="px-3 pt-2 text-[11px] text-white/40">
          v0.1 · cars module
        </div>
      </div>
    </aside>
  );
}
