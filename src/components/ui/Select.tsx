import { Field } from "@/components/ui/Field";
import { cn } from "@/lib/utils";

type Option = { value: string; label: string };

type Props = {
  label?: string;
  hint?: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<Option>;
  className?: string;
};

export function Select({ label, hint, error, value, onChange, options, className }: Props) {
  return (
    <Field label={label} hint={hint} error={error}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-9 w-full rounded-lg bg-zinc-900 px-3 text-sm text-zinc-100 ring-1 ring-zinc-800",
          "focus:outline-none focus:ring-2 focus:ring-teal-500/60",
          className
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-zinc-900">
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

