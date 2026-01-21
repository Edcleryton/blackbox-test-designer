import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";
import { Field } from "@/components/ui/Field";

type Props = ComponentPropsWithoutRef<"textarea"> & {
  label?: string;
  hint?: string;
  error?: string;
};

export function Textarea({ label, hint, error, className, ...props }: Props) {
  return (
    <Field label={label} hint={hint} error={error}>
      <textarea
        className={cn(
          "w-full rounded-lg bg-zinc-900 px-3 py-2 text-sm text-zinc-100 ring-1 ring-zinc-800",
          "placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-teal-500/60",
          className
        )}
        {...props}
      />
    </Field>
  );
}

