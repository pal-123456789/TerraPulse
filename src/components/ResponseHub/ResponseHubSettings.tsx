import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Loader2, Radio } from "lucide-react";
import { toast } from "sonner";

type Cfg = {
  enabled: boolean;
  sms_phone: string;
  sms_from: string;
  teams_team_id: string;
  teams_channel_id: string;
  excel_item_id: string;
  excel_worksheet: string;
  voice_id: string;
  min_severity: string;
};

const empty: Cfg = {
  enabled: true,
  sms_phone: "",
  sms_from: "",
  teams_team_id: "",
  teams_channel_id: "",
  excel_item_id: "",
  excel_worksheet: "Sheet1",
  voice_id: "EXAVITQu4vr4xnSDxMaL",
  min_severity: "high",
};

export const ResponseHubSettings = () => {
  const [cfg, setCfg] = useState<Cfg>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);
      const { data } = await supabase
        .from("response_hub_config" as any)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) setCfg({ ...empty, ...(data as any) });
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    if (!userId) return;
    setSaving(true);
    const { error } = await supabase
      .from("response_hub_config" as any)
      .upsert({ user_id: userId, ...cfg }, { onConflict: "user_id" });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Response Hub saved");
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <Card className="p-6 space-y-5 bg-card/60 backdrop-blur-xl border-primary/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="text-primary" />
          <h3 className="text-lg font-semibold">Anomaly Response Hub</h3>
        </div>
        <Switch checked={cfg.enabled} onCheckedChange={(v) => setCfg({ ...cfg, enabled: v })} />
      </div>
      <p className="text-sm text-muted-foreground">
        One click → Twilio SMS + Teams alert + Excel log + ElevenLabs voice briefing, geo-enriched with Google Maps.
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label>SMS To (E.164)</Label>
          <Input value={cfg.sms_phone} placeholder="+15558675310"
            onChange={(e) => setCfg({ ...cfg, sms_phone: e.target.value })} />
        </div>
        <div>
          <Label>Twilio From Number</Label>
          <Input value={cfg.sms_from} placeholder="+15017122661"
            onChange={(e) => setCfg({ ...cfg, sms_from: e.target.value })} />
        </div>
        <div>
          <Label>Teams Team ID</Label>
          <Input value={cfg.teams_team_id}
            onChange={(e) => setCfg({ ...cfg, teams_team_id: e.target.value })} />
        </div>
        <div>
          <Label>Teams Channel ID</Label>
          <Input value={cfg.teams_channel_id}
            onChange={(e) => setCfg({ ...cfg, teams_channel_id: e.target.value })} />
        </div>
        <div>
          <Label>Excel Drive Item ID</Label>
          <Input value={cfg.excel_item_id}
            onChange={(e) => setCfg({ ...cfg, excel_item_id: e.target.value })} />
        </div>
        <div>
          <Label>Worksheet</Label>
          <Input value={cfg.excel_worksheet}
            onChange={(e) => setCfg({ ...cfg, excel_worksheet: e.target.value })} />
        </div>
        <div>
          <Label>ElevenLabs Voice ID</Label>
          <Input value={cfg.voice_id}
            onChange={(e) => setCfg({ ...cfg, voice_id: e.target.value })} />
        </div>
        <div>
          <Label>Trigger when severity ≥</Label>
          <Select value={cfg.min_severity} onValueChange={(v) => setCfg({ ...cfg, min_severity: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button onClick={save} disabled={saving} className="w-full">
        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Save Hub Settings
      </Button>
    </Card>
  );
};

export default ResponseHubSettings;
