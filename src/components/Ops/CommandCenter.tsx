import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Bug, Shield, Zap, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { motion } from "framer-motion";

interface Stats {
  sentryOpen: number;
  aikidoCritical: number;
  rulesFired24h: number;
  mtta: string;
}

const CommandCenter = () => {
  const [stats, setStats] = useState<Stats>({ sentryOpen: 0, aikidoCritical: 0, rulesFired24h: 0, mtta: "—" });
  const [series, setSeries] = useState<{ t: string; sentry: number; aikido: number }[]>([]);
  const [pulse, setPulse] = useState(0);

  const load = async () => {
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const [sentryRes, aikidoRes, runsRes] = await Promise.all([
      supabase.functions.invoke("fetch-sentry-issues", { body: {} }),
      supabase
        .from("security_findings")
        .select("severity,last_seen_at,status")
        .eq("scanner", "aikido")
        .gte("last_seen_at", since),
      supabase
        .from("ops_remediation_runs")
        .select("created_at,status")
        .gte("created_at", since),
    ]);

    const sentryIssues: any[] = (sentryRes.data as any)?.issues ?? [];
    const sentryOpen = sentryIssues.length;
    const aikido = aikidoRes.data ?? [];
    const aikidoCritical = aikido.filter((f: any) => f.severity === "critical" && f.status === "open").length;
    const runs = runsRes.data ?? [];
    const rulesFired24h = runs.filter((r: any) => r.status === "success").length;

    // Build 24h hourly series
    const buckets: Record<string, { sentry: number; aikido: number }> = {};
    for (let i = 23; i >= 0; i--) {
      const d = new Date(Date.now() - i * 3600 * 1000);
      const key = `${d.getHours()}h`;
      buckets[key] = { sentry: 0, aikido: 0 };
    }
    const keys = Object.keys(buckets);
    sentryIssues.forEach((i) => {
      const d = new Date(i.lastSeen);
      const hAgo = Math.floor((Date.now() - d.getTime()) / 3600000);
      if (hAgo >= 0 && hAgo < 24) buckets[keys[23 - hAgo]].sentry += 1;
    });
    aikido.forEach((f: any) => {
      const d = new Date(f.last_seen_at);
      const hAgo = Math.floor((Date.now() - d.getTime()) / 3600000);
      if (hAgo >= 0 && hAgo < 24) buckets[keys[23 - hAgo]].aikido += 1;
    });

    setSeries(keys.map((k) => ({ t: k, sentry: buckets[k].sentry, aikido: buckets[k].aikido })));
    setStats({ sentryOpen, aikidoCritical, rulesFired24h, mtta: rulesFired24h ? "<2m" : "—" });
    setPulse((p) => p + 1);
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  const cards = [
    { label: "Sentry — open", value: stats.sentryOpen, Icon: Bug, tone: "text-purple-300", border: "border-purple-500/30", bg: "bg-purple-500/10" },
    { label: "Aikido — critical", value: stats.aikidoCritical, Icon: Shield, tone: "text-destructive", border: "border-destructive/40", bg: "bg-destructive/10" },
    { label: "Auto-fires (24h)", value: stats.rulesFired24h, Icon: Zap, tone: "text-emerald-300", border: "border-emerald-500/30", bg: "bg-emerald-500/10" },
    { label: "MTTA", value: stats.mtta, Icon: Activity, tone: "text-primary", border: "border-primary/30", bg: "bg-primary/10" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map(({ label, value, Icon, tone, border, bg }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className={`glass-panel p-4 border ${border}`}>
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-lg ${bg} ${border} border flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${tone}`} />
                </div>
                <motion.div
                  key={pulse + label}
                  initial={{ scale: 1.4, opacity: 0.6 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`text-3xl font-bold ${tone}`}
                >
                  {value}
                </motion.div>
              </div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground mt-3">{label}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="glass-panel border-primary/20 p-5">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-foreground">Last 24h — events per hour</h3>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
              <XAxis dataKey="t" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Line type="monotone" dataKey="sentry" name="Sentry" stroke="#a78bfa" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="aikido" name="Aikido" stroke="#34d399" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs">
          <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[#a78bfa]" /> Sentry</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[#34d399]" /> Aikido</div>
          <Badge variant="outline" className="ml-auto text-[10px]">Auto-refresh 30s</Badge>
        </div>
      </Card>
    </div>
  );
};

export default CommandCenter;
