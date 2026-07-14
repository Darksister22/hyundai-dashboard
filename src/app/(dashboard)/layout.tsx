import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/layout/AdminShell";
import type { Role } from "@/lib/roles";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let role: Role = "admin"; // unconfigured dev fallback: show everything
  const supabase = await createClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (!profile?.role) redirect("/no-access"); // defense in depth
    role = profile.role as Role;
  }
  return <AdminShell role={role}>{children}</AdminShell>;
}
