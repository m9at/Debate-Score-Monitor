/** إحصائيات الجمهور — read by the admin panel, written only by وضع الجمهور. */
export interface PublicViewStats {
  views: number;
  uniqueVisitors: number;
  roundViews: Record<string, number>;
  resultViews: number;
  lastViewAt: string | null;
}

const VISITOR_KEY = "public_visitor_id";

/** Anonymous, per-browser id — the only thing behind «الزوار الفريدون». */
export function getVisitorId(): string {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

export async function fetchPublicStats(
  tournamentId: string,
): Promise<PublicViewStats | null> {
  try {
    const r = await fetch(`/api/public-view-stats/${tournamentId}`);
    if (!r.ok) return null;
    return (await r.json()) as PublicViewStats;
  } catch {
    return null;
  }
}

/** Records one public-view open. Failures are ignored — it is only a counter. */
export async function recordPublicView(
  tournamentId: string,
  opts: { round?: number; result?: boolean } = {},
): Promise<void> {
  try {
    await fetch(`/api/public-view-stats/${tournamentId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId: getVisitorId(), ...opts }),
    });
  } catch {
    // ignore
  }
}
