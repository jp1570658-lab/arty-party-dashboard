"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Plus, Trash2, Sparkles, Send, Users } from "lucide-react";
import { toast } from "sonner";
import { AIEmailModal, type EmailRequest } from "@/components/ai/AIEmailModal";
import { Button, Input } from "@/components/ui/primitives";
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
  partySize: number | null;
  respondedAt: string | null;
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
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);

  // Head count from actual RSVPs — plus-ones included.
  const confirmed = invites.filter((i) => i.status === "confirmed");
  const headCount = confirmed.reduce((sum, i) => sum + (i.partySize ?? 1), 0);
  const awaiting = invites.filter((i) => i.status === "sent").length;

  async function sendInvites() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setSending(true);
    try {
      const res = await fetch(`/api/events/${eventId}/guests/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteIds: ids }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");

      const failed = (data.results ?? []).filter((r: { ok: boolean }) => !r.ok);
      if (data.sent > 0) {
        toast.success(`Invitation sent to ${data.sent} guest${data.sent === 1 ? "" : "s"}`);
        setInvites((p) =>
          p.map((i) =>
            ids.includes(i.id) && !failed.some((f: { id: string }) => f.id === i.id)
              ? { ...i, status: "sent" }
              : i
          )
        );
      }
      for (const f of failed) toast.error(`${f.name}: ${f.error}`);
      setSelected(new Set());
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  }

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
      {/* RSVP summary */}
      {invites.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-surface-2 px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-brand-purple" />
            <span className="font-semibold text-ink-primary">{headCount}</span>
            <span className="text-ink-secondary">
              coming from {confirmed.length} confirmed
              {awaiting > 0 && ` · ${awaiting} awaiting reply`}
            </span>
          </div>
          {selected.size > 0 && (
            <Button onClick={sendInvites} loading={sending}>
              <Send className="h-4 w-4" />
              Send invitation ({selected.size})
            </Button>
          )}
        </div>
      )}

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
          <div key={inv.id} className="flex items-center justify-between gap-2 rounded-lg border bg-surface-0 px-3 py-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <input
                type="checkbox"
                checked={selected.has(inv.id)}
                disabled={!inv.guest.email}
                title={
                  inv.guest.email
                    ? "Select to email an invitation"
                    : "No email on file for this guest"
                }
                onChange={(e) =>
                  setSelected((s) => {
                    const n = new Set(s);
                    if (e.target.checked) n.add(inv.id);
                    else n.delete(inv.id);
                    return n;
                  })
                }
                className="h-4 w-4 shrink-0 accent-[var(--brand-purple)] disabled:opacity-30"
              />
              <div className="min-w-0">
                <span className="font-medium text-ink-primary">{inv.guest.name}</span>
                {inv.guest.role && (
                  <span className="ml-2 text-xs text-ink-muted">{inv.guest.role}</span>
                )}
                {inv.status === "confirmed" && (inv.partySize ?? 1) > 1 && (
                  <span className="ml-2 text-xs text-ink-secondary">
                    +{(inv.partySize ?? 1) - 1}
                  </span>
                )}
              </div>
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
