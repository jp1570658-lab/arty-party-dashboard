"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Plus, Trash2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AIEmailModal, type EmailRequest } from "@/components/ai/AIEmailModal";
import { Input } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { INVITE_STATUSES, INVITE_STATUS_LABELS } from "@/lib/enums";

interface GuestLite {
  id: string;
  name: string;
  email: string | null;
  role: string | null;
}
interface InviteItem {
  id: string;
  status: string;
  guest: GuestLite;
}

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-surface-2 text-ink-secondary",
  sent: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  confirmed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  declined: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

export function GuestsSection({
  eventId,
  event,
  initial,
  allGuests,
}: {
  eventId: string;
  event: Record<string, unknown>;
  initial: InviteItem[];
  allGuests: GuestLite[];
}) {
  const router = useRouter();
  const [invites, setInvites] = useState<InviteItem[]>(initial);
  const [query, setQuery] = useState("");
  const [emailReq, setEmailReq] = useState<EmailRequest | null>(null);

  const invitedIds = new Set(invites.map((i) => i.guest.id));
  const matches = allGuests.filter(
    (g) =>
      !invitedIds.has(g.id) &&
      g.name.toLowerCase().includes(query.toLowerCase())
  );

  async function invite(guest: GuestLite) {
    try {
      const res = await fetch(`/api/events/${eventId}/guests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestId: guest.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setInvites((p) => [...p, data]);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to invite");
    }
  }

  async function cycleStatus(invite: InviteItem) {
    const i = INVITE_STATUSES.indexOf(invite.status as (typeof INVITE_STATUSES)[number]);
    const next = INVITE_STATUSES[(i + 1) % INVITE_STATUSES.length];
    setInvites((p) => p.map((x) => (x.id === invite.id ? { ...x, status: next } : x)));
    try {
      await fetch(`/api/events/${eventId}/guests/${invite.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
    } catch {
      toast.error("Failed to update");
    }
  }

  async function remove(id: string) {
    const prev = invites;
    setInvites((p) => p.filter((x) => x.id !== id));
    try {
      const res = await fetch(`/api/events/${eventId}/guests/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setInvites(prev);
      toast.error("Failed to remove");
    }
  }

  return (
    <div className="space-y-4">
      {/* Invited list */}
      <div className="space-y-2">
        {invites.length === 0 && (
          <p className="text-sm text-ink-muted">
            No invites yet. Search your{" "}
            <Link href="/guests" className="font-medium text-brand-purple">guest list</Link>{" "}
            below to add people.
          </p>
        )}
        {invites.map((inv) => (
          <div key={inv.id} className="flex items-center justify-between rounded-lg border bg-surface-0 px-3 py-2">
            <div>
              <span className="font-medium text-ink-primary">{inv.guest.name}</span>
              {inv.guest.role && <span className="ml-2 text-xs text-ink-muted">{inv.guest.role}</span>}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() =>
                  setEmailReq({
                    type: "invite",
                    event,
                    recipient: inv.guest as unknown as Record<string, unknown>,
                  })
                }
                className="text-ink-muted hover:text-brand-purple"
                title="Draft invite email"
              >
                <Sparkles className="h-4 w-4" />
              </button>
              <button
                onClick={() => cycleStatus(inv)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                  STATUS_STYLE[inv.status]
                )}
              >
                {INVITE_STATUS_LABELS[inv.status]}
              </button>
              <button onClick={() => remove(inv.id)} className="text-ink-muted hover:text-danger" aria-label="Remove">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Search to add */}
      <div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            placeholder="Search guests to invite…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        {query && (
          <div className="mt-2 space-y-1">
            {matches.length === 0 ? (
              <p className="px-1 text-xs text-ink-muted">
                No matches.{" "}
                <Link href="/guests" className="text-brand-purple">Add a new guest</Link>
              </p>
            ) : (
              matches.slice(0, 6).map((g) => (
                <button
                  key={g.id}
                  onClick={() => invite(g)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-2"
                >
                  <span>
                    {g.name}
                    {g.role && <span className="ml-2 text-xs text-ink-muted">{g.role}</span>}
                  </span>
                  <Plus className="h-4 w-4 text-brand-purple" />
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <AIEmailModal
        open={!!emailReq}
        onClose={() => setEmailReq(null)}
        request={emailReq}
        title="Guest invitation"
      />
    </div>
  );
}
