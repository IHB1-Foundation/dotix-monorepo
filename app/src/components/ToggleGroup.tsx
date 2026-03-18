"use client";

type ToggleItem<T extends string> = {
  value: T;
  label: string;
};

type ToggleGroupProps<T extends string> = {
  items: ToggleItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
};

export function ToggleGroup<T extends string>({
  items,
  value,
  onChange,
  className = "",
}: ToggleGroupProps<T>) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
            value === item.value
              ? "bg-ocean text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
