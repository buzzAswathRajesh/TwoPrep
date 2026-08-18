import React from "react";

export function ChipGroup<T extends string>({
  options,
  selected,
  onToggle,
  onClear,
  allLabel = "All",
}: {
  options: T[];
  selected: T[];
  onToggle: (value: T) => void;
  onClear?: () => void;
  allLabel?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {onClear && (
        <button type="button" onClick={onClear} className={selected.length === 0 ? "chip-on" : "chip-off"}>
          {allLabel}
        </button>
      )}
      {options.map((opt) => (
        <button key={opt} type="button" onClick={() => onToggle(opt)} className={selected.includes(opt) ? "chip-on" : "chip-off"}>
          {opt}
        </button>
      ))}
    </div>
  );
}
