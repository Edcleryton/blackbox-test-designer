export function PlaceholderForm({ title }: { title: string }) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold text-zinc-100">{title}</div>
      <div className="rounded-xl bg-zinc-950 p-3 text-sm text-zinc-400 ring-1 ring-zinc-800">
        No MVP, esta técnica aparece para planejamento e seleção, mas a geração detalhada ainda não foi implementada.
      </div>
    </div>
  );
}

