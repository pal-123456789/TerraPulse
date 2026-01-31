import { useEffect, useState, useCallback, useMemo, memo, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingVFX } from "@/components/3D/LoadingVFX";
import { MotionSection } from "@/components/MotionSection";
import { 
  MapPin, 
  AlertTriangle, 
  Zap, 
  Globe2, 
  Thermometer, 
  Wind, 
  Droplets,
  Eye,
  Clock,
  Activity,
  Filter,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";

// Lazy load the heavy Leaflet map
const LeafletMap = lazy(() => import("@/components/Map/LeafletMap"));

interface Anomaly {
  id: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  severity: string;
  anomaly_type: string;
  status: string;
  detected_at: string;
}

// Memoized marker component for performance
const MapMarker = memo(({ anomaly, isSelected, onClick }: { 
  anomaly: Anomaly; 
  isSelected: boolean;
  onClick: () => void;
}) => {
  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-500 shadow-red-500/50';
      case 'high': return 'bg-orange-500 shadow-orange-500/50';
      case 'medium': return 'bg-yellow-500 shadow-yellow-500/50';
      default: return 'bg-blue-500 shadow-blue-500/50';
    }
  };

  return (
    <motion.button
      onClick={onClick}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.3 }}
      className={`absolute w-4 h-4 rounded-full ${getSeverityColor(anomaly.severity)} shadow-lg cursor-pointer z-20 ${isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-background' : ''}`}
      style={{
        left: `${((anomaly.longitude + 180) / 360) * 100}%`,
        top: `${((90 - anomaly.latitude) / 180) * 100}%`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <span className="absolute inset-0 rounded-full animate-ping opacity-75" 
        style={{ backgroundColor: 'inherit' }} 
      />
    </motion.button>
  );
});

MapMarker.displayName = 'MapMarker';

const MapExplorer = () => {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [mapView, setMapView] = useState<'2d' | 'heat'>('2d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAnomalies = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('anomalies')
        .select('*')
        .order('detected_at', { ascending: false });

      if (error) throw error;
      
      // Add mock data if no anomalies exist
      const mockAnomalies: Anomaly[] = [
        { id: '1', name: 'Tropical Storm Formation', description: 'Unusual atmospheric pressure changes detected', latitude: 25.7617, longitude: -80.1918, severity: 'critical', anomaly_type: 'weather', status: 'active', detected_at: new Date().toISOString() },
        { id: '2', name: 'Seismic Activity Alert', description: 'Minor tremors detected in fault zone', latitude: 35.6762, longitude: 139.6503, severity: 'high', anomaly_type: 'seismic', status: 'active', detected_at: new Date().toISOString() },
        { id: '3', name: 'Ocean Temperature Anomaly', description: 'Above average ocean surface temperature', latitude: -33.8688, longitude: 151.2093, severity: 'medium', anomaly_type: 'temperature', status: 'monitoring', detected_at: new Date().toISOString() },
        { id: '4', name: 'Air Quality Warning', description: 'Elevated particulate matter detected', latitude: 51.5074, longitude: -0.1278, severity: 'high', anomaly_type: 'pollution', status: 'active', detected_at: new Date().toISOString() },
        { id: '5', name: 'Volcanic Activity', description: 'Increased volcanic emissions observed', latitude: -8.4095, longitude: 115.1889, severity: 'critical', anomaly_type: 'volcanic', status: 'active', detected_at: new Date().toISOString() },
        { id: '6', name: 'Drought Conditions', description: 'Extended dry period affecting region', latitude: -25.2744, longitude: 133.7751, severity: 'medium', anomaly_type: 'drought', status: 'monitoring', detected_at: new Date().toISOString() },
        { id: '7', name: 'Flooding Risk', description: 'Heavy rainfall causing river levels to rise', latitude: 13.7563, longitude: 100.5018, severity: 'high', anomaly_type: 'flood', status: 'active', detected_at: new Date().toISOString() },
        { id: '8', name: 'Magnetic Field Disturbance', description: 'Unusual geomagnetic activity detected', latitude: 64.1466, longitude: -21.9426, severity: 'low', anomaly_type: 'magnetic', status: 'monitoring', detected_at: new Date().toISOString() },
      ];

      setAnomalies(data?.length ? data : mockAnomalies);
    } catch (error) {
      console.error('Error fetching anomalies:', error);
      toast.error('Failed to load anomaly data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnomalies();

    // Real-time subscription
    const channel = supabase
      .channel('anomalies-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'anomalies' }, () => {
        fetchAnomalies();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAnomalies]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAnomalies();
    setIsRefreshing(false);
    toast.success('Map data refreshed');
  };

  const filteredAnomalies = useMemo(() => {
    if (filterSeverity === 'all') return anomalies;
    return anomalies.filter(a => a.severity.toLowerCase() === filterSeverity);
  }, [anomalies, filterSeverity]);

  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-500/20 text-red-400 border-red-500/30',
      high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    };
    return colors[severity.toLowerCase()] || colors.low;
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'weather': return Wind;
      case 'seismic': return Activity;
      case 'temperature': return Thermometer;
      case 'pollution': return Droplets;
      default: return AlertTriangle;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-space-gradient flex items-center justify-center">
        <LoadingVFX text="Loading Global Map..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-space-gradient relative overflow-hidden">
      <div className="absolute inset-0 bg-cyber-grid pointer-events-none opacity-20" />
      
      <Navigation />

      <main className="container mx-auto px-4 sm:px-6 pt-24 pb-12 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <MotionSection className="text-center mb-8">
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Globe2 className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-sm font-medium text-primary">Live Global Monitor</span>
            </motion.div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-foreground">
              Global <span className="text-primary text-glow">Map Explorer</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Real-time visualization of environmental anomalies worldwide
            </p>
          </MotionSection>

          {/* Controls */}
          <MotionSection delay={0.1} className="mb-6">
            <Card className="glass-ultra border-primary/20">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Filter:</span>
                    {['all', 'critical', 'high', 'medium', 'low'].map((sev) => (
                      <Button
                        key={sev}
                        variant={filterSeverity === sev ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterSeverity(sev)}
                        className="capitalize"
                      >
                        {sev}
                      </Button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                    <div className="flex rounded-lg border border-border overflow-hidden">
                      <Button
                        variant="default"
                        size="sm"
                        className="rounded-none"
                      >
                        <Globe2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </MotionSection>

          {/* Main Map */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Real Leaflet Map */}
            <MotionSection delay={0.2} className="lg:col-span-2">
              <Card className="glass-ultra border-primary/20 overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    Interactive World Map
                    <Badge variant="outline" className="ml-auto">
                      <Zap className="w-3 h-3 mr-1 animate-pulse" />
                      {filteredAnomalies.length} Active
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-[500px] w-full">
                    <Suspense fallback={
                      <div className="w-full h-full flex items-center justify-center bg-background/50">
                        <LoadingVFX text="Loading Map..." />
                      </div>
                    }>
                      <LeafletMap
                        onAnomalySelect={setSelectedAnomaly}
                        selectedAnomaly={selectedAnomaly}
                        filterSeverity={filterSeverity}
                      />
                    </Suspense>
                  </div>
                  {/* Legend */}
                  <div className="flex flex-wrap gap-4 p-4 text-xs border-t border-border/50">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="text-muted-foreground">Critical</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500" />
                      <span className="text-muted-foreground">High</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <span className="text-muted-foreground">Medium</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-muted-foreground">Low</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </MotionSection>

            {/* Sidebar */}
            <MotionSection delay={0.3} className="space-y-6">
              {/* Selected Anomaly Detail */}
              <AnimatePresence mode="wait">
                {selectedAnomaly && (
                  <motion.div
                    key={selectedAnomaly.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <Card className="glass-ultra border-primary/30 glow-border">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Eye className="w-5 h-5 text-primary" />
                          Selected Event
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h3 className="font-bold text-foreground text-lg">{selectedAnomaly.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{selectedAnomaly.description}</p>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Badge className={getSeverityBadge(selectedAnomaly.severity)}>
                            {selectedAnomaly.severity}
                          </Badge>
                          <Badge variant="outline">{selectedAnomaly.anomaly_type}</Badge>
                          <Badge variant="outline" className="bg-primary/10">
                            {selectedAnomaly.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Latitude</p>
                            <p className="font-mono text-foreground">{selectedAnomaly.latitude.toFixed(4)}°</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Longitude</p>
                            <p className="font-mono text-foreground">{selectedAnomaly.longitude.toFixed(4)}°</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>Detected: {new Date(selectedAnomaly.detected_at).toLocaleString()}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Anomaly List */}
              <Card className="glass-ultra">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <AlertTriangle className="w-5 h-5 text-primary" />
                    Active Anomalies
                  </CardTitle>
                </CardHeader>
                <CardContent className="max-h-[400px] overflow-y-auto space-y-3">
                  {filteredAnomalies.map((anomaly, i) => {
                    const TypeIcon = getTypeIcon(anomaly.anomaly_type);
                    return (
                      <motion.div
                        key={anomaly.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => setSelectedAnomaly(anomaly)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedAnomaly?.id === anomaly.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border/50 hover:border-primary/30 bg-card/50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getSeverityBadge(anomaly.severity)} border shrink-0`}>
                            <TypeIcon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm text-foreground truncate">{anomaly.name}</h4>
                            <p className="text-xs text-muted-foreground truncate">{anomaly.anomaly_type}</p>
                          </div>
                          <Badge className={`${getSeverityBadge(anomaly.severity)} text-xs shrink-0`}>
                            {anomaly.severity}
                          </Badge>
                        </div>
                      </motion.div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Stats */}
              <Card className="glass-ultra">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <p className="text-2xl font-bold text-red-400">
                        {anomalies.filter(a => a.severity === 'critical').length}
                      </p>
                      <p className="text-xs text-muted-foreground">Critical</p>
                    </div>
                    <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                      <p className="text-2xl font-bold text-orange-400">
                        {anomalies.filter(a => a.severity === 'high').length}
                      </p>
                      <p className="text-xs text-muted-foreground">High</p>
                    </div>
                    <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                      <p className="text-2xl font-bold text-yellow-400">
                        {anomalies.filter(a => a.severity === 'medium').length}
                      </p>
                      <p className="text-xs text-muted-foreground">Medium</p>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <p className="text-2xl font-bold text-blue-400">
                        {anomalies.filter(a => a.severity === 'low').length}
                      </p>
                      <p className="text-xs text-muted-foreground">Low</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </MotionSection>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MapExplorer;
