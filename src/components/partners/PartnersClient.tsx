"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Handshake, Mail, Globe, Pencil, Trash2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { PartnerForm, type PartnerFormData } from "./PartnerForm";
import { AIEmailModal, type EmailRequest } from "@/components/ai/AIEmailModal";
import { Button, Card, EmptyState } from "@/components/ui/primitives";

interface PartnerRow extends PartnerFormData {
  id: string;
  _count?: { events: number };
}

export function PartnersClient({ partners }: { partners: PartnerRow[] }) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PartnerFormData | undefined>(undefined);
  const [emailReq, setEmailReq] = useState<EmailRequest | null>(null);

  function openNew() {
    setEditing(undefined);
    setFormOpen(true);
  }
  function openEdit(p: PartnerRow) {
    setEditing(p);
    setFormOpen(true);
  }

  async function remove(id: string) {
    if (!confirm("Delete this partner?")) return;
    try {
      const res = await fetch(`/api/partners/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Partner deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-primary">Partners</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Sponsors, venues, brands and media partners.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" />
          Add partner
        </Button>
      </div>

      {partners.length === 0 ? (
        <EmptyState
          icon={Handshake}
          title="No partners yet"
          description="Track sponsors and collaborators, and draft outreach emails with AI."
          action={
            <Button onClick={openNew}>
              <Plus className="h-4 w-4" />
              Add your first partner
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {partners.map((p) => (
            <Card key={p.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-ink-primary">{p.name}</h3>
                  <span className="inline-block rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium capitalize text-ink-secondary">
                    {p.type}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(p)} className="btn-ghost px-2 py-1.5" aria-label="Edit">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => remove(p.id)} className="btn-ghost px-2 py-1.5 text-ink-muted hover:text-danger" aria-label="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {p.contactName && (
                <div className="text-sm text-ink-secondary">{p.contactName}</div>
              )}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
                {p.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {p.email}
                  </span>
                )}
                {p.website && (
                  <span className="flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    {p.website}
                  </span>
                )}
              </div>
              {p.collabNotes && (
                <p className="text-sm text-ink-secondary">{p.collabNotes}</p>
              )}
              <div>
                <button
                  onClick={() =>
                    setEmailReq({
                      type: "collab",
                      recipient: p as unknown as Record<string, unknown>,
                    })
                  }
                  className="flex items-center gap-1.5 text-sm font-medium text-brand-purple hover:text-brand-purple-dark"
                >
                  <Sparkles className="h-4 w-4" />
                  Draft collab proposal
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <PartnerForm open={formOpen} onClose={() => setFormOpen(false)} partner={editing} />
      <AIEmailModal
        open={!!emailReq}
        onClose={() => setEmailReq(null)}
        request={emailReq}
        title="Collaboration proposal"
      />
    </div>
  );
}
