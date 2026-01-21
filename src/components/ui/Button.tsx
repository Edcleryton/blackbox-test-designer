import type { ComponentPropsWithoutRef, ElementType } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost";

type Props = ComponentPropsWithoutRef<"button"> & {
  variant?: ButtonVariant;
  leftIcon?: ElementType;
};

export function Button({
  className,
  variant = "primary",
  leftIcon: LeftIcon,
  disabled,
  children,
  ...props
}: Props) {
  return (
    <button
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium ring-1 ring-transparent transition",
        "focus:outline-none focus:ring-2 focus:ring-teal-500/60",
        disabled && "pointer-events-none opacity-60",
        variant === "primary" && "bg-teal-500 text-zinc-950 hover:bg-teal-400",
        variant === "secondary" && "bg-zinc-900 text-zinc-100 ring-1 ring-zinc-800 hover:bg-zinc-800",
        variant === "ghost" && "bg-transparent text-zinc-100 ring-1 ring-zinc-800 hover:bg-zinc-900",
        className
      )}
      disabled={disabled}
      {...props}
    >
      {LeftIcon ? <LeftIcon className="size-4" /> : null}
      {children}
    </button>
  );
}

