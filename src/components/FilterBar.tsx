"use client";

import { CATEGORY_OPTIONS } from "@/lib/constants";
import type { Filters, RestaurantCategory } from "@/types/restaurant";

type FilterBarProps = {
  filters: Filters;
  onChange: (next: Filters) => void;
};

function getButtonClass(active: boolean) {
  return active
    ? "rounded-full bg-[linear-gradient(180deg,#ff973f_0%,#ff7a2f_100%)] px-4 py-2 text-sm font-medium text-white shadow-[0_8px_18px_rgba(255,122,47,0.18)]"
    : "rounded-full bg-white/92 px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-orange-100 transition hover:bg-orange-50";
}

export function FilterBar({ filters, onChange }: FilterBarProps) {
  const toggleCategory = (category: RestaurantCategory) => {
    const categories = filters.categories.includes(category)
      ? []
      : [category];

    onChange({ ...filters, categories });
  };

  return (
    <section className="flex flex-wrap gap-2 rounded-full border border-orange-100/80 bg-white/40 p-2 backdrop-blur-sm w-fit max-w-full">
      {CATEGORY_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          className={getButtonClass(filters.categories.includes(option.value))}
          onClick={() => toggleCategory(option.value)}
        >
          {option.label}
        </button>
      ))}
    </section>
  );
}
