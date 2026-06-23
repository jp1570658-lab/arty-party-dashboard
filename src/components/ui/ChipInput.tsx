"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";

export function ChipInput({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");

  function add() {
    const v = input.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setInput("");
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 rounded-full bg-brand-purple-light px-2.5 py-1 text-xs font-medium text-brand-purple"
          >
            {v}
            <button onClick={() => onChange(values.filter((x) => x !== v))} aria-label="Remove">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className="input py-1.5"
        />
        <button onClick={add} className="btn-secondary px-2.5 py-1.5" aria-label="Add">
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
