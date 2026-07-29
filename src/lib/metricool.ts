// Metricool — read-only social performance for JP's own accounts.
//
// Metricool holds the OAuth relationship with Instagram/Facebook/TikTok, so the
// dashboard never touches per-platform developer apps or tokens. It needs three
// things, and degrades to a clear "not connected" state without them:
//
//   METRICOOL_API_TOKEN  Account Settings → Access → API (Advanced plan or higher)
//   METRICOOL_USER_ID    the numeric account id
//   METRICOOL_BLOG_ID    the brand ("blog") id whose networks you want to read
//
// Nothing here posts or schedules — JP posts manually by choice.

const BASE = "https://app.metricool.com/api";

export interface MetricoolStatus {
  configured: boolean;
  /** Present only when a call actually failed. */
  error?: string;
}

export function metricoolConfig() {
  const token = process.env.METRICOOL_API_TOKEN;
  const userId = process.env.METRICOOL_USER_ID;
  const blogId = process.env.METRICOOL_BLOG_ID;
  const configured =
    !!token && token.trim().length > 0 && !!userId && !!blogId;
  return { token, userId, blogId, configured };
}

export class MetricoolNotConfiguredError extends Error {
  constructor() {
    super("Metricool is not configured");
    this.name = "MetricoolNotConfiguredError";
  }
}

async function get<T>(path: string, params: Record<string, string>): Promise<T> {
  const { token, userId, blogId, configured } = metricoolConfig();
  if (!configured) throw new MetricoolNotConfiguredError();

  const url = new URL(BASE + path);
  url.searchParams.set("userId", userId!);
  url.searchParams.set("blogId", blogId!);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url, {
    headers: { "X-Mc-Auth": token!, Accept: "application/json" },
    // Performance data changes slowly; don't hammer the API on every render.
    next: { revalidate: 900 },
  });

  if (!res.ok) {
    throw new Error(
      res.status === 401 || res.status === 403
        ? "Metricool rejected the API token — check METRICOOL_API_TOKEN and that your plan includes API access."
        : `Metricool returned ${res.status}`
    );
  }
  return (await res.json()) as T;
}

export interface NetworkSummary {
  network: string;
  followers: number | null;
  followersDelta: number | null;
  posts: number | null;
  engagement: number | null;
}

interface TimelinePoint {
  dateTime?: string;
  values?: { value?: number }[];
}

function lastValue(points: TimelinePoint[] | undefined): number | null {
  if (!Array.isArray(points) || points.length === 0) return null;
  const v = points[points.length - 1]?.values?.[0]?.value;
  return typeof v === "number" ? v : null;
}

function firstValue(points: TimelinePoint[] | undefined): number | null {
  if (!Array.isArray(points) || points.length === 0) return null;
  const v = points[0]?.values?.[0]?.value;
  return typeof v === "number" ? v : null;
}

/**
 * Follower counts and growth over the window, per connected network.
 * Networks the brand hasn't connected simply don't report, and are skipped.
 */
export async function fetchPerformance(days = 30): Promise<{
  networks: NetworkSummary[];
  from: string;
  to: string;
}> {
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  const iso = (d: Date) => d.toISOString().slice(0, 19);

  const networks = ["instagram", "facebook", "tiktok"] as const;

  const results = await Promise.all(
    networks.map(async (network): Promise<NetworkSummary | null> => {
      try {
        const data = await get<{ data?: TimelinePoint[] }>(
          "/v2/analytics/timelines",
          {
            network,
            metric: "followers",
            start: iso(from),
            end: iso(to),
          }
        );
        const points = data.data;
        const latest = lastValue(points);
        const earliest = firstValue(points);
        if (latest === null) return null;
        return {
          network,
          followers: latest,
          followersDelta:
            earliest !== null ? latest - earliest : null,
          posts: null,
          engagement: null,
        };
      } catch (err) {
        if (err instanceof MetricoolNotConfiguredError) throw err;
        // A network that isn't connected just isn't part of the picture.
        return null;
      }
    })
  );

  return {
    networks: results.filter((n): n is NetworkSummary => n !== null),
    from: iso(from),
    to: iso(to),
  };
}
