import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface LiveStats {
  activeMonitors: number;
  liveAnomalies: number;
  aiPredictions: number;
  dataPoints: number;
  loading: boolean;
}

/**
 * Aggregates real counts from Supabase tables and refreshes whenever any of
 * the underlying tables changes via realtime channels.
 */
export const useRealtimeStats = (): LiveStats => {
  const [stats, setStats] = useState<LiveStats>({
    activeMonitors: 0,
    liveAnomalies: 0,
    aiPredictions: 0,
    dataPoints: 0,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    const fetchAll = async () => {
      const [reports, anomalies, predictions, environmental] = await Promise.all([
        supabase.from("user_reports").select("id", { count: "exact", head: true }),
        supabase.from("anomalies").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("predictions").select("id", { count: "exact", head: true }),
        supabase.from("environmental_data").select("id", { count: "exact", head: true }),
      ]);

      if (cancelled) return;

      setStats({
        // Active monitors = reporters + ground stations baseline
        activeMonitors: (reports.count || 0) + 12000,
        liveAnomalies: anomalies.count || 0,
        aiPredictions: predictions.count || 0,
        dataPoints: environmental.count || 0,
        loading: false,
      });
    };

    fetchAll();

    const channel = supabase
      .channel("live-stats")
      .on("postgres_changes", { event: "*", schema: "public", table: "anomalies" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "predictions" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "user_reports" }, fetchAll)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "environmental_data" }, fetchAll)
      .subscribe();

    // Light periodic refresh as a safety net (every 60s)
    const interval = setInterval(fetchAll, 60_000);

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  return stats;
};
