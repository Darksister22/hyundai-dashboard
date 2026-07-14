import { Sidebar } from "./Sidebar";
import { DialogProvider } from "@/components/ui/dialog";
import type { Role } from "@/lib/roles";

export function AdminShell({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh">
      <Sidebar role={role} />
      <main className="flex-1 overflow-x-hidden">
        <DialogProvider>{children}</DialogProvider>
      </main>
    </div>
  );
}
