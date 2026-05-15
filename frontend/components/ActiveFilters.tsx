interface ActiveFilterChip {
  id: string;
  label: string;
  onRemove: () => void;
}

interface ActiveFiltersProps {
  chips: ActiveFilterChip[];
  totalResults: number;
  onClearAll: () => void;
}

export function ActiveFilters({
  chips,
  totalResults,
  onClearAll,
}: ActiveFiltersProps) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-slate-600">{totalResults} results</p>
      <div className="flex flex-wrap items-center gap-2">
        {chips.map((chip) => (
          <button
            key={chip.id}
            className="rounded-full bg-[#eef4ff] px-3 py-2 text-xs font-semibold text-[#1d4ed8]"
            onClick={chip.onRemove}
          >
            {chip.label} x
          </button>
        ))}
        {chips.length ? (
          <button
            className="text-xs font-medium text-slate-500 underline-offset-2 hover:underline"
            onClick={onClearAll}
          >
            Clear all
          </button>
        ) : null}
      </div>
    </div>
  );
}
