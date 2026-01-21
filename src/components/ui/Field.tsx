import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  label?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
};

export function Field({ label, hint, error, children }: Props) {
  return (
    <div className="space-y-1">
      {label ? <div className="text-xs font-medium text-zinc-200">{label}</div> : null}
      {children}
      {error ? <div className={cn("text-xs text-red-300")}>{error}</div> : null}
      {!error && hint ? <div className="text-xs text-zinc-500">{hint}</div> : null}
    </div>
  );
}

