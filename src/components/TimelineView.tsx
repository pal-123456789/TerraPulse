import { Card } from "@/components/ui/card";

interface TimelineViewProps {
  anomalies: any[];
}

const TimelineView = ({ anomalies }: TimelineViewProps) => {
  // Group anomalies by year
  const groupedByYear = anomalies.reduce((acc, anomaly) => {
    const year = new Date(anomaly.detected_at).getFullYear().toString();
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(anomaly);
    return acc;
  }, {} as Record<string, any[]>);

  const timeline = Object.entries(groupedByYear)
    .map(([year, events]) => ({ year, events }))
    .sort((a, b) => parseInt(b.year) - parseInt(a.year));

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "extreme": return "bg-red-500";
      case "critical": return "bg-orange-500";
      case "high": return "bg-yellow-500";
      default: return "bg-blue-500";
    }
  };

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-primary/30" />

      <div className="space-y-8">
        {timeline.map((yearGroup) => (
          <div key={yearGroup.year} className="relative">
            {/* Year marker */}
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center border-4 border-background relative z-10">
                <span className="text-lg font-bold text-primary">{yearGroup.year}</span>
              </div>
              <div className="h-0.5 flex-1 bg-primary/20" />
            </div>

            {/* Events for this year */}
            <div className="ml-24 space-y-4">
              {(yearGroup.events as any[]).map((event: any) => (
                <Card key={event.id} className="glass-panel p-4 hover:glow-border transition-all duration-300">
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${getSeverityColor(event.severity)}`} />
                    <div className="flex-1">
                      <h4 className="font-bold text-foreground">{event.name}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(event.detected_at).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs px-2 py-1 rounded bg-muted/50 text-muted-foreground">
                          {event.anomaly_type}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          event.severity === "extreme" ? "bg-red-500/20 text-red-400" :
                          event.severity === "critical" ? "bg-orange-500/20 text-orange-400" :
                          event.severity === "high" ? "bg-yellow-500/20 text-yellow-400" :
                          "bg-blue-500/20 text-blue-400"
                        }`}>
                          {event.severity}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimelineView;
