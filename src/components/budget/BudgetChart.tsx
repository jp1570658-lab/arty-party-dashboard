"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";

export interface BudgetItemLite {
  category: string;
  estimated: number;
  actual: number | null;
}

export function BudgetChart({ items }: { items: BudgetItemLite[] }) {
  const byCategory = new Map<string, { estimated: number; actual: number }>();
  for (const it of items) {
    const cur = byCategory.get(it.category) ?? { estimated: 0, actual: 0 };
    cur.estimated += it.estimated;
    cur.actual += it.actual ?? 0;
    byCategory.set(it.category, cur);
  }
  const data = Array.from(byCategory.entries()).map(([category, v]) => ({
    category,
    Estimated: Math.round(v.estimated),
    Actual: Math.round(v.actual),
  }));

  if (data.length === 0) return null;

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
          <YAxis
            type="category"
            dataKey="category"
            width={110}
            tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
          />
          <Tooltip
            contentStyle={{
              background: "var(--surface-0)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(v) => `€${v}`}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Estimated" fill="#C4B5FD" radius={[0, 4, 4, 0]} />
          <Bar dataKey="Actual" fill="#7C3AED" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
