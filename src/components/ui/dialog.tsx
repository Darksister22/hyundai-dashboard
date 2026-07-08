"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { cn } from "@/lib/utils";

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}
interface AlertOptions {
  title: string;
  description?: string;
  okLabel?: string;
}

type Request =
  | ({ mode: "confirm"; resolve: (v: boolean) => void } & ConfirmOptions)
  | ({ mode: "alert"; resolve: (v: boolean) => void } & AlertOptions);

interface DialogApi {
  confirm: (o: ConfirmOptions) => Promise<boolean>;
  alert: (o: AlertOptions) => Promise<void>;
}

const Ctx = createContext<DialogApi | null>(null);

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [req, setReq] = useState<Request | null>(null);

  const confirm = useCallback(
    (o: ConfirmOptions) =>
      new Promise<boolean>((resolve) =>
        setReq({ mode: "confirm", resolve, ...o })
      ),
    []
  );
  const alert = useCallback(
    (o: AlertOptions) =>
      new Promise<void>((resolve) =>
        setReq({ mode: "alert", resolve: () => resolve(), ...o })
      ),
    []
  );

  function finish(result: boolean) {
    setReq((cur) => {
      cur?.resolve(result);
      return null;
    });
  }

  useEffect(() => {
    if (!req) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish(false);
      if (e.key === "Enter") finish(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [req]);

  return (
    <Ctx.Provider value={{ confirm, alert }}>
      {children}
      {req ? (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-black/40 p-4"
          onClick={() => finish(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-surface)] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5">
              <h3 className="text-base font-semibold text-[var(--color-ink)]">
                {req.title}
              </h3>
              {req.description ? (
                <p className="mt-1.5 text-sm text-[var(--color-ink-muted)]">
                  {req.description}
                </p>
              ) : null}
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-[var(--color-line)] bg-[var(--color-app)] px-6 py-3">
              {req.mode === "confirm" ? (
                <button
                  type="button"
                  onClick={() => finish(false)}
                  className="inline-flex h-9 items-center rounded-[var(--radius-md)] px-4 text-sm font-medium text-[var(--color-ink-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]"
                >
                  {req.cancelLabel ?? "Cancel"}
                </button>
              ) : null}
              <button
                type="button"
                autoFocus
                onClick={() => finish(true)}
                className={cn(
                  "inline-flex h-9 items-center rounded-[var(--radius-md)] px-5 text-sm font-medium text-white",
                  req.mode === "confirm" && req.danger
                    ? "bg-[var(--color-danger)] hover:opacity-90"
                    : "bg-[var(--color-navy)] hover:bg-[var(--color-navy-700)]"
                )}
              >
                {req.mode === "confirm"
                  ? req.confirmLabel ?? "Confirm"
                  : req.okLabel ?? "OK"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </Ctx.Provider>
  );
}

export function useDialog(): DialogApi {
  const c = useContext(Ctx);
  if (!c) throw new Error("useDialog must be used within DialogProvider");
  return c;
}
