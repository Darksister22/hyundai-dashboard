import { Sidebar } from "./Sidebar";
import { DialogProvider } from "@/components/ui/dialog";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden">
        <DialogProvider>{children}</DialogProvider>
      </main>
    </div>
  );
}
