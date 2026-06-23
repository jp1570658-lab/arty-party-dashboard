"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, UserCheck, Mail, Phone, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { GuestForm, type GuestFormData } from "./GuestForm";
import { Button, Card, EmptyState } from "@/components/ui/primitives";

interface GuestRow extends GuestFormData {
  id: string;
}

export function GuestsClient({ guests }: { guests: GuestRow[] }) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<GuestFormData | undefined>(undefined);

  function openNew() {
    setEditing(undefined);
    setFormOpen(true);
  }

  async function remove(id: string) {
    if (!confirm("Delete this guest?")) return;
    try {
      const res = await fetch(`/api/guests/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Guest deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-primary">Guests</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Your contact list — collectors, journalists, regulars and VIPs.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" />
          Add guest
        </Button>
      </div>

      {guests.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="No guests yet"
          description="Build a contact list you can invite to any event with one tap."
          action={
            <Button onClick={openNew}>
              <Plus className="h-4 w-4" />
              Add your first guest
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {guests.map((g) => (
            <Card key={g.id} className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate font-semibold text-ink-primary">{g.name}</h3>
                {g.role && <p className="text-xs text-ink-secondary">{g.role}</p>}
                <div className="mt-1 space-y-0.5 text-xs text-ink-muted">
                  {g.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {g.email}
                    </div>
                  )}
                  {g.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {g.phone}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <button onClick={() => { setEditing(g); setFormOpen(true); }} className="btn-ghost px-2 py-1.5" aria-label="Edit">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => remove(g.id)} className="btn-ghost px-2 py-1.5 text-ink-muted hover:text-danger" aria-label="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <GuestForm open={formOpen} onClose={() => setFormOpen(false)} guest={editing} />
    </div>
  );
}
