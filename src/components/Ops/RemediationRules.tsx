import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Zap, PlayCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Rule {
  id: string;
  name: string;
  trigger_source: "sentry" | "aikido";
  trigger_severity: "low" | "medium" | "high" | "critical" | "any";
  trigger_match: string | null;
  action: "email" | "webhook";
  action_target: string;
  enabled: boolean;
  last_fired_at: string | null;
}

const empty = {
  name: "",
  trigger_source: "sentry" as const,
  trigger_severity: "high" as const,
  trigger_match: "",
  action: "email" as const,
  action_target: "",
};

const RemediationRules = () => {
  const [rules, setRules] = useState<Rule[]>([]);
  const [runs, setRuns] = useState<any[]>([]);
  const [form, setForm] = useState({ ...empty });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [r, rn] = await Promise.all([
      supabase.from("ops_remediation_rules").select("*").order("created_at", { ascending: false }),
      supabase.from("ops_remediation_runs").select("*").order("created_at", { ascending: false }).limit(20),
    ]);
    setRules((r.data ?? []) as Rule[]);
    setRuns(rn.data ?? []);
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.name || !form.action_target) {
      toast.error("Name and action target are required");
      return;
    }
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Sign in first"); setBusy(false); return; }
    const { error } = await supabase.from("ops_remediation_rules").insert({
      user_id: user.id,
      name: form.name,
      trigger_source: form.trigger_source,
      trigger_severity: form.trigger_severity,
      trigger_match: form.trigger_match || null,
      action: form.action,
      action_target: form.action_target,
      enabled: true,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Rule created");
    setForm({ ...empty });
    load();
  };

  const toggle = async (r: Rule) => {
    await supabase.from("ops_remediation_rules").update({ enabled: !r.enabled }).eq("id", r.id);
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("ops_remediation_rules").delete().eq("id", id);
    load();
  };

  const runNow = async () => {
    const { error } = await supabase.functions.invoke("ops-rule-dispatcher", { body: {} });
    if (error) toast.error(error.message);
    else { toast.success("Dispatcher ran"); load(); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="glass-panel border-primary/20 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-foreground">New Rule</h3>
        </div>

        <div className="space-y-3">
          <div>
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Page on-call for fatal Sentry errors" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Source</Label>
              <Select value={form.trigger_source} onValueChange={(v: any) => setForm({ ...form, trigger_source: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sentry">Sentry</SelectItem>
                  <SelectItem value="aikido">Aikido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Minimum severity</Label>
              <Select value={form.trigger_severity} onValueChange={(v: any) => setForm({ ...form, trigger_severity: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="low">Low+</SelectItem>
                  <SelectItem value="medium">Medium+</SelectItem>
                  <SelectItem value="high">High+</SelectItem>
                  <SelectItem value="critical">Critical only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Title contains (optional)</Label>
            <Input value={form.trigger_match} onChange={(e) => setForm({ ...form, trigger_match: e.target.value })}
              placeholder="e.g. TypeError or s3-bucket" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Action</Label>
              <Select value={form.action} onValueChange={(v: any) => setForm({ ...form, action: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Send email</SelectItem>
                  <SelectItem value="webhook">POST webhook</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{form.action === "email" ? "Email address" : "Webhook URL"}</Label>
              <Input value={form.action_target} onChange={(e) => setForm({ ...form, action_target: e.target.value })}
                placeholder={form.action === "email" ? "ops@company.com" : "https://hooks.example.com/..."} />
            </div>
          </div>

          <Button onClick={create} disabled={busy} className="w-full gap-2">
            <Plus className="w-4 h-4" /> Create rule
          </Button>
        </div>
      </Card>

      <Card className="glass-panel border-primary/20 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-foreground">Active Rules ({rules.length})</h3>
          <Button size="sm" variant="outline" onClick={runNow} className="gap-2">
            <PlayCircle className="w-4 h-4" /> Run now
          </Button>
        </div>

        <div className="space-y-2 max-h-[35vh] overflow-y-auto pr-1">
          {rules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No rules yet.</div>
          ) : rules.map((r) => (
            <div key={r.id} className="p-3 rounded-lg bg-background/40 border border-border/50">
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-foreground">{r.name}</span>
                    <Badge variant="outline" className="text-[10px] uppercase">{r.trigger_source}</Badge>
                    <Badge variant="outline" className="text-[10px]">{r.trigger_severity}+</Badge>
                    <Badge variant="outline" className="text-[10px]">{r.action}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 truncate">→ {r.action_target}</div>
                  {r.last_fired_at && (
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      Last fired {formatDistanceToNow(new Date(r.last_fired_at), { addSuffix: true })}
                    </div>
                  )}
                </div>
                <Switch checked={r.enabled} onCheckedChange={() => toggle(r)} />
                <Button size="icon" variant="ghost" onClick={() => remove(r.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-border/50">
          <h4 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Recent runs</h4>
          <div className="space-y-1 max-h-[20vh] overflow-y-auto pr-1">
            {runs.length === 0 ? (
              <div className="text-xs text-muted-foreground">No runs yet.</div>
            ) : runs.map((rn) => (
              <div key={rn.id} className="flex items-center gap-2 text-xs">
                <Badge variant="outline" className={rn.status === "success" ? "border-emerald-500/40 text-emerald-300" : "border-destructive/40 text-destructive"}>
                  {rn.status}
                </Badge>
                <span className="text-muted-foreground">{rn.source}</span>
                <span className="text-foreground truncate flex-1">{rn.finding_ref}</span>
                <span className="text-muted-foreground">{formatDistanceToNow(new Date(rn.created_at), { addSuffix: true })}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default RemediationRules;
