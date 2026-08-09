import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Bug, ExternalLink, RefreshCw, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

type Item = {
  id: string;
  source: "sentry" | "aikido";
  title: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  ts: string;
  link?: string;
  meta?: string;
};

const SEV: Record<Item["severity"], string> = {
  critical: "bg-destructive/20 text-destructive border-destructive/40",
  high: "bg-orange-500/15 text-orange-400 border-orange-500/40",
  medium: "bg-yellow-500/15 text-yellow-300 border-yellow-500/40",
  low: "bg-sky-500/15 text-sky-300 border-sky-500/40",
  info: "bg-muted text-muted-foreground border-border",
};

const sentryLevelToSeverity = (l: string): Item["severity"] => {
  if (l === "fatal") return "critical";
  if (l === "error") return "high";
  if (l === "warning") return "medium";
  if (l === "info") return "info";
  return "low";
};

const UnifiedTimeline = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState("all");
  const [sevFilter, setSevFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    try {
      const [aikidoRes, sentryRes] = await Promise.all([
        supabase
          .from("security_findings")
          .select("id,scanner,external_id,title,severity,status,last_seen_at,metadata")
          .eq("scanner", "aikido")
          .order("last_seen_at", { ascending: false })
          .limit(100),
        supabase.functions.invoke("fetch-sentry-issues", { body: {} }),
      ]);

      const aikido: Item[] = (aikidoRes.data ?? []).map((r: any) => ({
        id: `aikido-${r.id}`,
        source: "aikido",
        title: r.title,
        severity: r.severity,
        ts: r.last_seen_at,
        link: undefined,
        meta: r.status,
      }));

      const sentryData: any = sentryRes.data ?? {};
      const sentry: Item[] = (sentryData.issues ?? []).map((i: any) => ({
        id: `sentry-${i.id}`,
        source: "sentry",
        title: i.title,
        severity: sentryLevelToSeverity(i.level),
        ts: i.lastSeen,
        link: i.permalink,
        meta: i.project ? `${i.project} · ${i.count} events` : `${i.count} events`,
      }));

      if (sentryData.configured === false) {
        toast.info("Sentry not connected — add SENTRY_AUTH_TOKEN & SENTRY_ORG_SLUG.");
      }

      const merged = [...aikido, ...sentry].sort(
        (a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime(),
      );
      setItems(merged);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load timeline");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("ops-timeline")
      .on("postgres_changes", { event: "*", schema: "public", table: "security_findings" }, () => load())
      .subscribe();
    const t = setInterval(load, 30000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(t);
    };
  }, []);

  const filtered = useMemo(
    () => items.filter(
      (i) =>
        (sourceFilter === "all" || i.source === sourceFilter) &&
        (sevFilter === "all" || i.severity === sevFilter),
    ),
    [items, sourceFilter, sevFilter],
  );

  return (
    <Card className="glass-panel border-primary/20 p-5">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-[160px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            <SelectItem value="sentry">Sentry</SelectItem>
            <SelectItem value="aikido">Aikido</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sevFilter} onValueChange={setSevFilter}>
          <SelectTrigger className="w-[160px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All severities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="info">Info</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" onClick={load} className="gap-2 ml-auto">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        <div className="text-xs text-muted-foreground">
          <span className="text-foreground font-medium">{filtered.length}</span> events
        </div>
      </div>

      <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-1">
        {loading && items.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Loading timeline…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No events. Sync Aikido or wait for Sentry to report issues.
          </div>
        ) : filtered.map((it) => (
          <div
            key={it.id}
            className="flex items-start gap-3 p-3 rounded-lg bg-background/40 border border-border/50 hover:border-primary/40 transition-colors"
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              it.source === "sentry" ? "bg-purple-500/15 border border-purple-500/30" : "bg-emerald-500/15 border border-emerald-500/30"
            }`}>
              {it.source === "sentry" ? <Bug className="w-4 h-4 text-purple-300" /> : <Shield className="w-4 h-4 text-emerald-300" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="uppercase text-[10px]">{it.source}</Badge>
                <Badge variant="outline" className={SEV[it.severity]}>{it.severity}</Badge>
                {it.meta && <span className="text-xs text-muted-foreground">{it.meta}</span>}
              </div>
              <div className="font-medium text-foreground mt-1 line-clamp-2">{it.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {formatDistanceToNow(new Date(it.ts), { addSuffix: true })}
              </div>
            </div>
            {it.link && (
              <a href={it.link} target="_blank" rel="noreferrer" className="text-primary hover:text-primary/80 shrink-0">
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};

export default UnifiedTimeline;
