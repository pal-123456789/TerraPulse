import { useEffect, useRef, useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Radio, Send, Volume2 } from "lucide-react";
import { toast } from "sonner";
import ResponseHubSettings from "@/components/ResponseHub/ResponseHubSettings";

type Anomaly = {
  id: string;
  name: string;
  severity: string;
  anomaly_type: string;
  latitude: number;
  longitude: number;
  status: string;
};

type Run = {
  id: string;
  triggered_at: string;
  status: string;
  summary: string | null;
  place_name: string | null;
  channels: any;
};

const sevRank: Record<string, number> = { low: 1, medium: 2, high: 3, critical: 4 };

const ResponseHub = () => {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [dispatching, setDispatching] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const load = async () => {
    const [a, r] = await Promise.all([
      supabase.from("anomalies").select("*").eq("status", "active").order("detected_at", { ascending: false }).limit(20),
      supabase.from("response_hub_runs" as any).select("*").order("triggered_at", { ascending: false }).limit(10),
    ]);
    setAnomalies((a.data ?? []) as Anomaly[]);
    setRuns((r.data ?? []) as any);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("response-hub-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "response_hub_runs" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "anomalies" }, () => load())
      .subscribe();
    const poll = setInterval(load, 20000);
    return () => {
      supabase.removeChannel(ch);
      clearInterval(poll);
    };
  }, []);

  const dispatch = async (a: Anomaly) => {
    setDispatching(a.id);
    try {
      const { data, error } = await supabase.functions.invoke("anomaly-response-hub", {
        body: { anomaly_id: a.id },
      });
      if (error) throw error;
      toast.success("Response dispatched");
      if (data?.audio_base64) {
        const audio = new Audio(`data:audio/mpeg;base64,${data.audio_base64}`);
        audioRef.current = audio;
        audio.play().catch(() => {});
      }
      load();
    } catch (e: any) {
      toast.error(e.message || "Dispatch failed");
    } finally {
      setDispatching(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-12 space-y-8">
        <header className="space-y-2">
          <div className="flex items-center gap-3">
            <Radio className="w-8 h-8 text-primary animate-pulse-glow" />
            <h1 className="text-3xl md:text-4xl font-bold">Anomaly Response Hub</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Fan-out a single critical anomaly to SMS (Twilio), Microsoft Teams, Excel incident log, and an
            AI voice briefing (ElevenLabs) — all enriched with Google Maps reverse geocoding.
          </p>
        </header>

        <ResponseHubSettings />

        <section>
          <h2 className="text-xl font-semibold mb-3">Active anomalies</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {anomalies.length === 0 && (
              <p className="text-muted-foreground">No active anomalies right now.</p>
            )}
            {anomalies.map((a) => (
              <Card key={a.id} className="p-4 bg-card/60 backdrop-blur-xl border-primary/20">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{a.name}</h3>
                    <p className="text-xs text-muted-foreground">{a.anomaly_type} · {a.latitude.toFixed(2)}, {a.longitude.toFixed(2)}</p>
                  </div>
                  <Badge variant={sevRank[a.severity] >= 3 ? "destructive" : "secondary"}>{a.severity}</Badge>
                </div>
                <Button
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => dispatch(a)}
                  disabled={dispatching === a.id}
                >
                  {dispatching === a.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  Dispatch response
                </Button>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Recent dispatches</h2>
          <div className="space-y-3">
            {runs.map((r) => (
              <Card key={r.id} className="p-4 bg-card/60 backdrop-blur-xl border-primary/10">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{new Date(r.triggered_at).toLocaleString()}</span>
                  <Badge variant={r.status === "complete" ? "default" : "destructive"}>{r.status}</Badge>
                </div>
                <p className="text-sm mt-1">{r.summary}</p>
                {r.place_name && <p className="text-xs text-primary mt-1">📍 {r.place_name}</p>}
                <div className="flex gap-2 mt-2 text-xs">
                  {r.channels?.sms?.ok && <Badge variant="outline">SMS ✓</Badge>}
                  {r.channels?.teams?.ok && <Badge variant="outline">Teams ✓</Badge>}
                  {r.channels?.excel?.ok && <Badge variant="outline">Excel ✓</Badge>}
                  {r.channels?.voice && <Badge variant="outline"><Volume2 className="w-3 h-3 mr-1"/>Voice ✓</Badge>}
                </div>
              </Card>
            ))}
            {runs.length === 0 && <p className="text-muted-foreground text-sm">No dispatches yet.</p>}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ResponseHub;
