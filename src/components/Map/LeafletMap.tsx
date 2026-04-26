import { useEffect, useState, useCallback, memo, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle, Thermometer, Wind, Droplets, Activity, Flame, Zap, Clock, MapPin
} from 'lucide-react';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

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

interface LeafletMapProps {
  onAnomalySelect?: (anomaly: Anomaly | null) => void;
  selectedAnomaly?: Anomaly | null;
  filterSeverity?: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#3b82f6',
};

// Cached icons keyed by severity — avoids re-creating divIcon per render.
const iconCache = new Map<string, L.DivIcon>();
const getIcon = (severity: string): L.DivIcon => {
  const key = severity.toLowerCase();
  const cached = iconCache.get(key);
  if (cached) return cached;
  const color = SEVERITY_COLORS[key] || SEVERITY_COLORS.low;
  const icon = L.divIcon({
    className: 'custom-marker-3d',
    html: `<div class="lf-marker" style="color:${color}"><div class="lf-ring"></div><div class="lf-core"></div></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
  iconCache.set(key, icon);
  return icon;
};

const MapController = memo(({ center, zoom }: { center: [number, number]; zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
});
MapController.displayName = 'MapController';

const getTypeIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'weather': return <Wind className="w-4 h-4" />;
    case 'seismic': return <Activity className="w-4 h-4" />;
    case 'temperature': return <Thermometer className="w-4 h-4" />;
    case 'pollution': return <Droplets className="w-4 h-4" />;
    case 'volcanic': return <Flame className="w-4 h-4" />;
    case 'magnetic': return <Zap className="w-4 h-4" />;
    default: return <AlertTriangle className="w-4 h-4" />;
  }
};

const AnomalyMarker = memo(({ anomaly, onClick }: { anomaly: Anomaly; onClick: () => void }) => {
  const color = SEVERITY_COLORS[anomaly.severity.toLowerCase()] || SEVERITY_COLORS.low;
  return (
    <Marker
      position={[anomaly.latitude, anomaly.longitude]}
      icon={getIcon(anomaly.severity)}
      eventHandlers={{ click: onClick }}
    >
      <Popup>
        <div className="p-3 min-w-[260px]">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}20`, color }}>
              {getTypeIcon(anomaly.anomaly_type)}
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-foreground">{anomaly.name}</h4>
              <Badge variant="outline" className="text-[10px] mt-1" style={{ borderColor: color, color }}>
                {anomaly.severity.toUpperCase()}
              </Badge>
            </div>
          </div>
          {anomaly.description && (
            <p className="text-sm text-muted-foreground mb-2">{anomaly.description}</p>
          )}
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {anomaly.latitude.toFixed(2)}, {anomaly.longitude.toFixed(2)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(anomaly.detected_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </Popup>
    </Marker>
  );
});
AnomalyMarker.displayName = 'AnomalyMarker';

const LeafletMap = ({ onAnomalySelect, selectedAnomaly, filterSeverity = 'all' }: LeafletMapProps) => {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([20, 0]);
  const [mapZoom, setMapZoom] = useState(2);
  const mapRef = useRef<L.Map | null>(null);

  // Fetch real anomalies only — no mock data.
  useEffect(() => {
    let cancelled = false;
    const fetchAnomalies = async () => {
      const { data, error } = await supabase
        .from('anomalies')
        .select('id, name, description, latitude, longitude, severity, anomaly_type, status, detected_at')
        .order('detected_at', { ascending: false })
        .limit(200);
      if (cancelled) return;
      if (!error && data) setAnomalies(data as Anomaly[]);
    };

    fetchAnomalies();

    const channel = supabase
      .channel('map-anomalies-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'anomalies' }, fetchAnomalies)
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (selectedAnomaly) {
      setMapCenter([selectedAnomaly.latitude, selectedAnomaly.longitude]);
      setMapZoom(6);
    }
  }, [selectedAnomaly]);

  const filteredAnomalies = useMemo(
    () => filterSeverity === 'all'
      ? anomalies
      : anomalies.filter(a => a.severity.toLowerCase() === filterSeverity),
    [anomalies, filterSeverity],
  );

  const handleAnomalyClick = useCallback((anomaly: Anomaly) => {
    onAnomalySelect?.(anomaly);
  }, [onAnomalySelect]);

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-xl overflow-hidden">
      <style>{`
        .leaflet-container { background: hsl(var(--background)) !important; font-family: inherit; }
        .leaflet-popup-content-wrapper { background: hsl(var(--card)) !important; color: hsl(var(--foreground)) !important; border: 1px solid hsl(var(--border)); }
        .leaflet-popup-tip { background: hsl(var(--card)) !important; }
        .leaflet-control-layers, .leaflet-control-zoom a { background: hsl(var(--card)) !important; color: hsl(var(--foreground)) !important; border-color: hsl(var(--border)) !important; }
        .leaflet-control-zoom a:hover { background: hsl(var(--accent)) !important; }
        .leaflet-control-attribution { background: hsl(var(--card) / 0.8) !important; color: hsl(var(--muted-foreground)) !important; }
      `}</style>

      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ width: '100%', height: '100%', minHeight: '500px' }}
        worldCopyJump
        preferCanvas
        ref={mapRef}
      >
        <MapController center={mapCenter} zoom={mapZoom} />

        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Dark">
            <TileLayer
              attribution='&copy; CARTO'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satellite">
            <TileLayer
              attribution='&copy; Esri'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Street">
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        {filteredAnomalies.map((anomaly) => (
          <AnomalyMarker
            key={anomaly.id}
            anomaly={anomaly}
            onClick={() => handleAnomalyClick(anomaly)}
          />
        ))}
      </MapContainer>

      <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm rounded-lg p-3 border border-border/50 z-[400]">
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-muted-foreground">{filteredAnomalies.length} live points</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(LeafletMap);
