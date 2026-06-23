"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button, Input, Select } from "@/components/ui/primitives";

interface PartnerLite {
  id: string;
  name: string;
  type: string;
}
interface EventPartnerItem {
  id: string;
  role: string | null;
  notes: string | null;
  partner: PartnerLite;
}

export function PartnersSection({
  eventId,
  initial,
  allPartners,
}: {
  eventId: string;
  initial: EventPartnerItem[];
  allPartners: PartnerLite[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<EventPartnerItem[]>(initial);
  const [partnerId, setPartnerId] = useState("");
  const [role, setRole] = useState("");

  const available = allPartners.filter(
    (p) => !items.some((i) => i.partner.id === p.id)
  );

  async function attach() {
    if (!partnerId) {
      toast.error("Pick a partner");
      return;
    }
    try {
      const res = await fetch(`/api/events/${eventId}/partners`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partnerId, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setItems((p) => [...p, data]);
      setPartnerId("");
      setRole("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to attach");
    }
  }

  async function remove(id: string) {
    const prev = items;
    setItems((p) => p.filter((i) => i.id !== id));
    try {
      const res = await fetch(`/api/events/${eventId}/partners/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setItems(prev);
      toast.error("Failed to remove");
    }
  }

  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <p className="text-sm text-ink-muted">
          No partners attached yet. Manage your full roster on the{" "}
          <Link href="/partners" className="font-medium text-brand-purple">
            Partners page
          </Link>
          .
        </p>
      )}

      <div className="space-y-2">
        {items.map((it) => (
          <div key={it.id} className="flex items-center justify-between rounded-lg border bg-surface-0 px-3 py-2">
            <div>
              <span className="font-medium text-ink-primary">{it.partner.name}</span>
              <span className="ml-2 text-xs capitalize text-ink-muted">{it.partner.type}</span>
              {it.role && <span className="ml-2 text-xs text-ink-secondary">· {it.role}</span>}
            </div>
            <button onClick={() => remove(it.id)} className="text-ink-muted hover:text-danger" aria-label="Remove">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {available.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <Select value={partnerId} onChange={(e) => setPartnerId(e.target.value)} className="w-auto flex-1">
            <option value="">Select a partner…</option>
            {available.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.type})
              </option>
            ))}
          </Select>
          <Input placeholder="Role (optional)" value={role} onChange={(e) => setRole(e.target.value)} className="w-auto flex-1" />
          <Button onClick={attach}>
            <Plus className="h-4 w-4" />
            Attach
          </Button>
        </div>
      ) : (
        <Link href="/partners" className="flex w-fit items-center gap-1.5 text-sm font-medium text-brand-purple hover:text-brand-purple-dark">
          <ExternalLink className="h-4 w-4" />
          Add more partners
        </Link>
      )}
    </div>
  );
}
