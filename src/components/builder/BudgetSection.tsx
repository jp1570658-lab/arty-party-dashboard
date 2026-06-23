"use client";

import { useState } from "react";
import { Plus, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { BudgetChart } from "@/components/budget/BudgetChart";
import { Input, Select } from "@/components/ui/primitives";
import { BUDGET_CATEGORIES } from "@/lib/enums";
import { formatMoney, cn } from "@/lib/utils";

interface BudgetItem {
  id: string;
  category: string;
  name: string;
  estimated: number;
  actual: number | null;
  paid: boolean;
  notes: string | null;
}

export function BudgetSection({
  eventId,
  initial,
}: {
  eventId: string;
  initial: BudgetItem[];
}) {
  const [items, setItems] = useState<BudgetItem[]>(initial);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({
    category: BUDGET_CATEGORIES[0] as string,
    name: "",
    estimated: "",
    actual: "",
  });

  const totalEst = items.reduce((s, i) => s + i.estimated, 0);
  const totalAct = items.reduce((s, i) => s + (i.actual ?? 0), 0);
  const variance = totalEst - totalAct;
  const anyActual = items.some((i) => i.actual != null);

  async function addItem() {
    if (!draft.name.trim()) {
      toast.error("Description required");
      return;
    }
    try {
      const res = await fetch(`/api/events/${eventId}/budget`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: draft.category,
          name: draft.name,
          estimated: draft.estimated,
          actual: draft.actual,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setItems((p) => [...p, data]);
      setDraft({ category: draft.category, name: "", estimated: "", actual: "" });
      setAdding(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add");
    }
  }

  async function patch(id: string, field: keyof BudgetItem, value: unknown) {
    setItems((p) => p.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
    try {
      await fetch(`/api/budget-items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
    } catch {
      toast.error("Failed to save");
    }
  }

  async function remove(id: string) {
    const prev = items;
    setItems((p) => p.filter((i) => i.id !== id));
    try {
      const res = await fetch(`/api/budget-items/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      setItems(prev);
      toast.error("Failed to delete");
    }
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border bg-surface-0 p-3">
          <div className="text-[11px] uppercase tracking-wide text-ink-muted">Estimated</div>
          <div className="text-lg font-semibold text-ink-primary">{formatMoney(totalEst)}</div>
        </div>
        <div className="rounded-lg border bg-surface-0 p-3">
          <div className="text-[11px] uppercase tracking-wide text-ink-muted">Actual</div>
          <div className="text-lg font-semibold text-ink-primary">{formatMoney(totalAct)}</div>
        </div>
        <div className="rounded-lg border bg-surface-0 p-3">
          <div className="text-[11px] uppercase tracking-wide text-ink-muted">Variance</div>
          <div className={cn("text-lg font-semibold", variance < 0 ? "text-danger" : "text-success")}>
            {variance < 0 ? "-" : "+"}
            {formatMoney(Math.abs(variance))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left text-xs uppercase tracking-wide text-ink-muted">
            <tr>
              <th className="px-3 py-2 font-semibold">Category</th>
              <th className="px-3 py-2 font-semibold">Description</th>
              <th className="px-3 py-2 text-right font-semibold">Estimated</th>
              <th className="px-3 py-2 text-right font-semibold">Actual</th>
              <th className="px-3 py-2 text-center font-semibold">Paid</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && !adding && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-ink-muted">
                  No budget items yet.
                </td>
              </tr>
            )}
            {items.map((it) => (
              <tr key={it.id} className="border-t">
                <td className="px-3 py-1.5 text-ink-secondary">{it.category}</td>
                <td className="px-3 py-1.5 text-ink-primary">{it.name}</td>
                <td className="px-2 py-1.5 text-right">
                  <input
                    type="number"
                    defaultValue={it.estimated}
                    onBlur={(e) => patch(it.id, "estimated", Number(e.target.value) || 0)}
                    className="input w-24 py-1 text-right"
                  />
                </td>
                <td className="px-2 py-1.5 text-right">
                  <input
                    type="number"
                    defaultValue={it.actual ?? ""}
                    placeholder="—"
                    onBlur={(e) =>
                      patch(it.id, "actual", e.target.value === "" ? null : Number(e.target.value))
                    }
                    className="input w-24 py-1 text-right"
                  />
                </td>
                <td className="px-3 py-1.5 text-center">
                  <input
                    type="checkbox"
                    checked={it.paid}
                    onChange={(e) => patch(it.id, "paid", e.target.checked)}
                    className="h-4 w-4 accent-[var(--brand-purple)]"
                  />
                </td>
                <td className="px-3 py-1.5 text-right">
                  <button onClick={() => remove(it.id)} className="text-ink-muted hover:text-danger" aria-label="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {adding && (
              <tr className="border-t bg-surface-1">
                <td className="px-2 py-1.5">
                  <Select value={draft.category} onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))} className="py-1">
                    {BUDGET_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </Select>
                </td>
                <td className="px-2 py-1.5">
                  <Input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="Description" className="py-1" />
                </td>
                <td className="px-2 py-1.5">
                  <Input type="number" value={draft.estimated} onChange={(e) => setDraft((d) => ({ ...d, estimated: e.target.value }))} className="w-24 py-1 text-right" />
                </td>
                <td className="px-2 py-1.5">
                  <Input type="number" value={draft.actual} onChange={(e) => setDraft((d) => ({ ...d, actual: e.target.value }))} className="w-24 py-1 text-right" />
                </td>
                <td></td>
                <td className="px-2 py-1.5">
                  <div className="flex gap-1">
                    <button onClick={addItem} className="btn-primary px-2 py-1" aria-label="Save"><Check className="h-4 w-4" /></button>
                    <button onClick={() => setAdding(false)} className="btn-ghost px-2 py-1" aria-label="Cancel"><X className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!adding && (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 text-sm font-medium text-brand-purple hover:text-brand-purple-dark"
        >
          <Plus className="h-4 w-4" />
          Add line item
        </button>
      )}

      {anyActual && items.length > 0 && (
        <div>
          <span className="section-label">Estimated vs actual by category</span>
          <BudgetChart items={items} />
        </div>
      )}
    </div>
  );
}
