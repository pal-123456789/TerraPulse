import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Shield, RefreshCw, AlertTriangle, CheckCircle2, ExternalLink, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Severity = "critical" | "high" | "medium" | "low" | "info";
type Status = "open" | "in_progress" | "fixed" | "ignored";

interface Finding {
  id: string;
  scanner: string;
  external_id: string;
  title: string;
  description: string | null;
  severity: Severity;
  status: Status;
  connector: string | null;
  resource: string | null;
  remediation: string | null;
  fixable: boolean;
  last_seen_at: string;
}

const SEVERITY_TONE: Record<Severity, string> = {
  critical: "bg-destructive/20 text-destructive border-destructive/40",
  high: "bg-orange-500/15 text-orange-400 border-orange-500/40",
  medium: "bg-yellow-500/15 text-yellow-300 border-yellow-500/40",
  low: "bg-sky-500/15 text-sky-300 border-sky-500/40",
  info: "bg-muted text-muted-foreground border-border",
};

const STATUS_TONE: Record<Status, string> = {
  open: "bg-destructive/15 text-destructive border-destructive/30",
  in_progress: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  fixed: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  ignored: "bg-muted text-muted-foreground border-border",
};

const ALL = "all";

const SecurityPanel = () => {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [severity, setSeverity] = useState<string>(ALL);
  const [status, setStatus] = useState<string>(ALL);
  const [connector, setConnector] = useState<string>(ALL);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("security_findings")
      .select("*")
      .order("last_seen_at", { ascending: false })
      .limit(500);
    if (error) toast.error("Could not load findings");
    else setFindings((data as Finding[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("security-findings-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "security_findings" }, () => load())
      .subscribe();
    const poll = setInterval(load, 30000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, []);

  const connectors = useMemo(
    () => Array.from(new Set(findings.map((f) => f.connector || f.scanner))).sort(),
    [findings],
  );

  const filtered = useMemo(
    () => findings.filter(
      (f) =>
        (severity === ALL || f.severity === severity) &&
        (status === ALL || f.status === status) &&
        (connector === ALL || (f.connector || f.scanner) === connector),
    ),
    [findings, severity, status, connector],
  );

  const stats = useMemo(() => {
    const open = findings.filter((f) => f.status === "open").length;
    const crit = findings.filter((f) => f.severity === "critical" && f.status === "open").length;
    const high = findings.filter((f) => f.severity === "high" && f.status === "open").length;
    const fixed = findings.filter((f) => f.status === "fixed").length;
    return { open, crit, high, fixed, total: findings.length };
  }, [findings]);

  const sync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("ingest-aikido-findings");
      if (error) throw error;
      if (data?.configured === false) {
        toast.info("Aikido not connected — add AIKIDO_CLIENT_ID & AIKIDO_CLIENT_SECRET in Project Settings.");
      } else if (data?.ok === false) {
        toast.warning(data?.error ?? "Aikido sync failed — check credentials.");
      } else {
        toast.success(`Imported ${data?.imported ?? 0} findings · ${data?.memoryAdded ?? 0} added to memory`);
      }
      await load();
    } catch (e: any) {
      toast.error(e?.message ?? "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <Card className="glass-panel border-primary/20 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Security Issues</h3>
              <p className="text-sm text-muted-foreground">All scan findings — Aikido, Supabase linter, RLS — in one place.</p>
            </div>
          </div>
          <Button onClick={sync} disabled={syncing} size="sm" className="gap-2">
            <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing…" : "Sync Aikido"}
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
          {[
            { label: "Total", value: stats.total, tone: "text-foreground" },
            { label: "Open", value: stats.open, tone: "text-destructive" },
            { label: "Critical", value: stats.crit, tone: "text-destructive" },
            { label: "High", value: stats.high, tone: "text-orange-400" },
            { label: "Fixed", value: stats.fixed, tone: "text-emerald-400" },
          ].map((s) => (
            <div key={s.label} className="p-3 rounded-lg bg-background/40 border border-border/50">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{s.label}</div>
              <div className={`text-xl font-bold ${s.tone}`}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Filter className="w-3.5 h-3.5" /> Filters
          </div>
          <Select value={severity} onValueChange={setSeverity}>
            <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Severity" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="info">Info</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In progress</SelectItem>
              <SelectItem value="fixed">Fixed</SelectItem>
              <SelectItem value="ignored">Ignored</SelectItem>
            </SelectContent>
          </Select>
          <Select value={connector} onValueChange={setConnector}>
            <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Connector" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All connectors</SelectItem>
              {connectors.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="ml-auto text-xs text-muted-foreground">
            <span className="text-foreground font-medium">{filtered.length}</span> / {findings.length}
          </div>
        </div>

        <div className="rounded-lg border border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Severity</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Connector</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last seen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading findings…</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto mb-2" />
                    <div className="text-foreground font-medium">No findings match these filters</div>
                    <div className="text-xs text-muted-foreground">Try "Sync Aikido" or adjust filters above.</div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell><Badge variant="outline" className={SEVERITY_TONE[f.severity]}>{f.severity}</Badge></TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground line-clamp-1">{f.title}</div>
                      {f.resource && <div className="text-xs text-muted-foreground line-clamp-1">{f.resource}</div>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{f.connector ?? f.scanner}</TableCell>
                    <TableCell><Badge variant="outline" className={STATUS_TONE[f.status]}>{f.status.replace("_", " ")}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(f.last_seen_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card className="glass-panel p-4 border-yellow-500/30">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold mb-1">Enable Leaked Password Protection</div>
            <p className="text-sm text-muted-foreground mb-2">
              Toggle this from the Supabase dashboard. Once on, sign-ins with breached passwords are blocked.
            </p>
            <a
              href="https://supabase.com/dashboard/project/bwqdgorcraiidyqbwlno/auth/providers"
              target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              Open Auth Providers <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default SecurityPanel;
