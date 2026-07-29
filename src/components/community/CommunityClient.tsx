"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Bookmark,
  ExternalLink,
  Filter,
  RefreshCw,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button, EmptyState } from "@/components/ui/primitives";
import {
  INSIGHT_KINDS,
  INSIGHT_KIND_LABELS,
  INSIGHT_KIND_STYLES,
  type InsightKind,
} from "@/lib/enums";
import { cn, formatDate } from "@/lib/utils";

export interface InsightItem {
  id: string;
  kind: string;
  title: string;
  body: string;
  relevance: string | null;
  url: string | null;
  source: string | null;
  batchDate: string;
  saved: boolean;
  dismissed: boolean;
}

interface NetworkSummary {
  network: string;
  followers: number | null;
  followersDelta: number | null;
}

export function CommunityClient({ initial }: { initial: InsightItem[] }) {
  const [insights, setInsights] = useState(initial);
  const [running, setRunning] = useState(false);
  const [filter, setFilter] = useState<InsightKind | "ALL" | "SAVED">("ALL");

  const visible = useMemo(() => {
    if (filter === "ALL") return insights;
    if (filter === "SAVED") return insights.filter((i) => i.saved);
    return insights.filter((i) => i.kind === filter);
  }, [insights, filter]);

  const grouped = useMemo(() => {
    const map = new Map<string, InsightItem[]>();
    for (const i of visible) {
      const key = i.batchDate;
      map.set(key, [...(map.get(key) ?? []), i]);
    }
    return Array.from(map.entries());
  }, [visible]);

  async function refresh() {
    setRunning(true);
    try {
      const res = await fetch("/api/insights", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      const listRes = await fetch("/api/insights");
      setInsights(await listRes.json());
      toast.success(`${data.created} fresh insights`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to gather insights");
    } finally {
      setRunning(false);
    }
  }

  async function patch(id: string, body: Partial<InsightItem>) {
    const prev = insights;
    setInsights((list) =>
      body.dismissed
        ? list.filter((i) => i.id !== id)
        : list.map((i) => (i.id === id ? { ...i, ...body } : i))
    );
    try {
      const res = await fetch(`/api/insights/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
    } catch {
      setInsights(prev);
      toast.error("Failed to update");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink-primary">Community</h1>
          <p className="text-sm text-ink-secondary">
            What&apos;s happening in your scene, and what to do about it.
          </p>
        </div>
        <Button onClick={refresh} loading={running}>
          <RefreshCw className={cn("h-4 w-4", running && "animate-spin")} />
          Refresh insights
        </Button>
      </div>

      <PerformancePanel />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-1.5">
        <Filter className="mr-1 h-3.5 w-3.5 text-ink-muted" />
        <FilterChip active={filter === "ALL"} onClick={() => setFilter("ALL")}>
          All
        </FilterChip>
        {INSIGHT_KINDS.map((k) => (
          <FilterChip key={k} active={filter === k} onClick={() => setFilter(k)}>
            {INSIGHT_KIND_LABELS[k]}
          </FilterChip>
        ))}
        <FilterChip active={filter === "SAVED"} onClick={() => setFilter("SAVED")}>
          Saved
        </FilterChip>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title={insights.length === 0 ? "No insights yet" : "Nothing in this filter"}
          description={
            insights.length === 0
              ? "Hit refresh and the AI will research what's happening in the Brussels arts scene — trends, open calls, accounts worth following, and what to do this week."
              : "Try a different filter."
          }
          action={
            insights.length === 0 ? (
              <Button onClick={refresh} loading={running}>
                <Sparkles className="h-4 w-4" />
                Gather insights
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-6">
          {grouped.map(([date, items]) => (
            <div key={date}>
              <div className="mb-2 flex items-center gap-2">
                <span className="section-label mb-0">{formatDate(date)}</span>
                <span className="text-xs text-ink-muted">{items.length}</span>
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                {items.map((i: InsightItem) => (
                  <InsightCard
                    key={i.id}
                    insight={i}
                    onSave={() => patch(i.id, { saved: !i.saved })}
                    onDismiss={() => patch(i.id, { dismissed: true })}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-brand-purple text-white"
          : "bg-surface-2 text-ink-secondary hover:text-ink-primary"
      )}
    >
      {children}
    </button>
  );
}

function InsightCard({
  insight,
  onSave,
  onDismiss,
}: {
  insight: InsightItem;
  onSave: () => void;
  onDismiss: () => void;
}) {
  const kind = insight.kind as InsightKind;
  return (
    <div className="group card flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-medium",
            INSIGHT_KIND_STYLES[kind] ?? INSIGHT_KIND_STYLES.TREND
          )}
        >
          {INSIGHT_KIND_LABELS[kind] ?? insight.kind}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={onSave}
            className={cn(
              "rounded-md p-1 transition-colors hover:text-brand-purple",
              insight.saved ? "text-brand-purple" : "text-ink-muted"
            )}
            title={insight.saved ? "Unsave" : "Save"}
          >
            <Bookmark
              className={cn("h-3.5 w-3.5", insight.saved && "fill-current")}
            />
          </button>
          <button
            onClick={onDismiss}
            className="rounded-md p-1 text-ink-muted opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
            title="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <h3 className="text-sm font-semibold text-ink-primary">{insight.title}</h3>
      <p className="text-sm text-ink-secondary">{insight.body}</p>

      {insight.relevance && (
        <p className="rounded-lg bg-surface-2 px-3 py-2 text-xs text-ink-secondary">
          <span className="font-medium text-ink-primary">Why it matters: </span>
          {insight.relevance}
        </p>
      )}

      {(insight.url || insight.source) && (
        <div className="mt-auto flex items-center gap-2 pt-1 text-xs">
          {insight.url ? (
            <a
              href={insight.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-brand-purple hover:underline"
            >
              {insight.source || "Source"}
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <span className="text-ink-muted">{insight.source}</span>
          )}
        </div>
      )}
    </div>
  );
}

/** Own-account performance from Metricool — inert until accounts are connected. */
function PerformancePanel() {
  const [state, setState] = useState<{
    loading: boolean;
    configured: boolean;
    error?: string;
    networks: NetworkSummary[];
  }>({ loading: true, configured: false, networks: [] });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/metricool/performance")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setState({
          loading: false,
          configured: !!d.configured,
          error: d.error,
          networks: d.networks ?? [],
        });
      })
      .catch(() => {
        if (!cancelled) {
          setState({ loading: false, configured: false, networks: [] });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.loading) return null;

  if (!state.configured || state.networks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-surface-1 p-4">
        <div className="flex items-start gap-3">
          <BarChart3 className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" />
          <div>
            <p className="text-sm font-medium text-ink-primary">
              Account performance not connected
            </p>
            <p className="mt-0.5 text-xs text-ink-muted">
              {state.error ??
                "Link Instagram, Facebook and TikTok inside Metricool, then add METRICOOL_API_TOKEN, METRICOOL_USER_ID and METRICOOL_BLOG_ID. Follower growth appears here once they report."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="mb-3 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-brand-purple" />
        <span className="section-label mb-0">Your accounts · last 30 days</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {state.networks.map((n) => (
          <div key={n.network}>
            <p className="text-xs capitalize text-ink-muted">{n.network}</p>
            <p className="text-xl font-semibold text-ink-primary">
              {n.followers?.toLocaleString() ?? "—"}
            </p>
            {n.followersDelta !== null && (
              <p
                className={cn(
                  "text-xs",
                  n.followersDelta > 0
                    ? "text-success"
                    : n.followersDelta < 0
                      ? "text-danger"
                      : "text-ink-muted"
                )}
              >
                {n.followersDelta > 0 ? "+" : ""}
                {n.followersDelta.toLocaleString()} followers
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
