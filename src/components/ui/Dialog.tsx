import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function Dialog({ open, title, description, onClose, children, footer, className }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className={cn("w-full max-w-2xl rounded-2xl bg-zinc-950 ring-1 ring-zinc-800", className)}>
          <div className="flex items-start justify-between gap-3 border-b border-zinc-800 p-4">
            <div>
              <div className="text-sm font-semibold">{title}</div>
              {description ? <div className="mt-0.5 text-xs text-zinc-400">{description}</div> : null}
            </div>
            <Button variant="ghost" onClick={onClose} className="h-8 px-2">
              <X className="size-4" />
            </Button>
          </div>
          <div className="p-4">{children}</div>
          {footer ? <div className="border-t border-zinc-800 p-4">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}

