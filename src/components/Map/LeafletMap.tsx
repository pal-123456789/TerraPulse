import { useEffect, useState, useCallback, memo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  Thermometer, 
  Wind, 
  Droplets, 
  Activity,
  Flame,
  Zap,
  Eye,
  Clock,
  MapPin
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

// Custom icon creator
const createCustomIcon = (severity: string) => {
  const colors: Record<string, string> = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#3b82f6',
  };
  const color = colors[severity.toLowerCase()] || colors.low;
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 24px;
        height: 24px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 0 20px ${color}, 0 4px 8px rgba(0,0,0,0.3);
        animation: pulse 2s infinite;
      "></div>
      <style>
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.8; }
        }
      </style>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

// Map controls for flying to locations
const MapController = memo(({ center, zoom }: { center: [number, number]; zoom: number }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, { duration: 1.5 });
    }
  }, [center, zoom, map]);
  
  return null;
});

MapController.displayName = 'MapController';

// Anomaly marker with 3D-like effects
const AnomalyMarker = memo(({ 
  anomaly, 
  isSelected, 
  onClick 
}: { 
  anomaly: Anomaly; 
  isSelected: boolean;
  onClick: () => void;
}) => {
  const getSeverityRadius = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 50000;
      case 'high': return 35000;
      case 'medium': return 25000;
      default: return 15000;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      default: return '#3b82f6';
    }
  };

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

  const position: [number, number] = [anomaly.latitude, anomaly.longitude];
  const color = getSeverityColor(anomaly.severity);

  return (
    <>
      {/* Animated pulse circle */}
      <Circle
        center={position}
        radius={getSeverityRadius(anomaly.severity)}
        pathOptions={{
          color: color,
          fillColor: color,
          fillOpacity: 0.15,
          weight: 1,
        }}
      />
      {/* Inner glow circle */}
      <Circle
        center={position}
        radius={getSeverityRadius(anomaly.severity) * 0.5}
        pathOptions={{
          color: color,
          fillColor: color,
          fillOpacity: 0.25,
          weight: 0,
        }}
      />
      {/* Marker */}
      <Marker
        position={position}
        icon={createCustomIcon(anomaly.severity)}
        eventHandlers={{ click: onClick }}
      >
        <Popup className="anomaly-popup">
          <div className="p-3 min-w-[250px] bg-background/95 backdrop-blur-sm rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}20`, color: color }}>
                {getTypeIcon(anomaly.anomaly_type)}
              </div>
              <div>
                <h4 className="font-bold text-foreground">{anomaly.name}</h4>
                <Badge 
                  variant="outline" 
                  className="text-[10px]"
                  style={{ borderColor: color, color: color }}
                >
                  {anomaly.severity.toUpperCase()}
                </Badge>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{anomaly.description}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {anomaly.latitude.toFixed(2)}, {anomaly.longitude.toFixed(2)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(anomaly.detected_at).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={anomaly.status === 'active' ? 'destructive' : 'secondary'} className="text-[10px]">
                {anomaly.status}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                {anomaly.anomaly_type}
              </Badge>
            </div>
          </div>
        </Popup>
      </Marker>
    </>
  );
});

AnomalyMarker.displayName = 'AnomalyMarker';

const LeafletMap = ({ onAnomalySelect, selectedAnomaly, filterSeverity = 'all' }: LeafletMapProps) => {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([20, 0]);
  const [mapZoom, setMapZoom] = useState(2);
  const mapRef = useRef<L.Map | null>(null);

  // Fetch anomalies
  useEffect(() => {
    const fetchAnomalies = async () => {
      const { data, error } = await supabase
        .from('anomalies')
        .select('*')
        .order('detected_at', { ascending: false });

      if (!error && data) {
        setAnomalies(data);
      } else {
        // Mock data
        setAnomalies([
          { id: '1', name: 'Tropical Storm Formation', description: 'Unusual atmospheric pressure changes detected indicating potential tropical cyclone development', latitude: 25.7617, longitude: -80.1918, severity: 'critical', anomaly_type: 'weather', status: 'active', detected_at: new Date().toISOString() },
          { id: '2', name: 'Seismic Activity Alert', description: 'Series of minor tremors detected along the Pacific Ring of Fire fault zone', latitude: 35.6762, longitude: 139.6503, severity: 'high', anomaly_type: 'seismic', status: 'active', detected_at: new Date().toISOString() },
          { id: '3', name: 'Ocean Temperature Anomaly', description: 'Surface temperatures 3°C above seasonal average indicating potential coral bleaching', latitude: -33.8688, longitude: 151.2093, severity: 'medium', anomaly_type: 'temperature', status: 'monitoring', detected_at: new Date().toISOString() },
          { id: '4', name: 'Air Quality Warning', description: 'PM2.5 levels exceeding safe thresholds due to industrial emissions', latitude: 51.5074, longitude: -0.1278, severity: 'high', anomaly_type: 'pollution', status: 'active', detected_at: new Date().toISOString() },
          { id: '5', name: 'Volcanic Activity', description: 'Increased sulfur dioxide emissions and seismic tremors near active volcano', latitude: -8.4095, longitude: 115.1889, severity: 'critical', anomaly_type: 'volcanic', status: 'active', detected_at: new Date().toISOString() },
          { id: '6', name: 'Drought Conditions', description: 'Extended dry period affecting agricultural regions', latitude: -25.2744, longitude: 133.7751, severity: 'medium', anomaly_type: 'drought', status: 'monitoring', detected_at: new Date().toISOString() },
          { id: '7', name: 'Flooding Risk', description: 'Heavy monsoon rainfall causing river levels to rise dangerously', latitude: 13.7563, longitude: 100.5018, severity: 'high', anomaly_type: 'flood', status: 'active', detected_at: new Date().toISOString() },
          { id: '8', name: 'Geomagnetic Storm', description: 'Solar wind disturbance affecting satellite communications', latitude: 64.1466, longitude: -21.9426, severity: 'low', anomaly_type: 'magnetic', status: 'monitoring', detected_at: new Date().toISOString() },
          { id: '9', name: 'Wildfire Alert', description: 'High fire danger due to dry conditions and strong winds', latitude: 34.0522, longitude: -118.2437, severity: 'critical', anomaly_type: 'fire', status: 'active', detected_at: new Date().toISOString() },
          { id: '10', name: 'Glacier Melt Acceleration', description: 'Accelerated ice loss detected in polar region', latitude: 78.2232, longitude: 15.6469, severity: 'medium', anomaly_type: 'climate', status: 'monitoring', detected_at: new Date().toISOString() },
        ]);
      }
    };

    fetchAnomalies();

    // Real-time subscription
    const channel = supabase
      .channel('map-anomalies')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'anomalies' }, () => {
        fetchAnomalies();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Fly to selected anomaly
  useEffect(() => {
    if (selectedAnomaly) {
      setMapCenter([selectedAnomaly.latitude, selectedAnomaly.longitude]);
      setMapZoom(8);
    }
  }, [selectedAnomaly]);

  const filteredAnomalies = filterSeverity === 'all' 
    ? anomalies 
    : anomalies.filter(a => a.severity.toLowerCase() === filterSeverity);

  const handleAnomalyClick = useCallback((anomaly: Anomaly) => {
    onAnomalySelect?.(anomaly);
    setMapCenter([anomaly.latitude, anomaly.longitude]);
    setMapZoom(8);
  }, [onAnomalySelect]);

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-xl overflow-hidden">
      {/* Custom styles */}
      <style>{`
        .leaflet-container {
          background: hsl(var(--background)) !important;
          font-family: inherit;
        }
        .leaflet-popup-content-wrapper {
          background: transparent !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .leaflet-popup-content {
          margin: 0 !important;
        }
        .leaflet-popup-tip {
          background: hsl(var(--background) / 0.95) !important;
        }
        .leaflet-control-layers {
          background: hsl(var(--card)) !important;
          border: 1px solid hsl(var(--border)) !important;
          border-radius: 0.5rem !important;
          color: hsl(var(--foreground)) !important;
        }
        .leaflet-control-layers-toggle {
          background-color: hsl(var(--card)) !important;
        }
        .leaflet-control-zoom a {
          background: hsl(var(--card)) !important;
          color: hsl(var(--foreground)) !important;
          border-color: hsl(var(--border)) !important;
        }
        .leaflet-control-zoom a:hover {
          background: hsl(var(--accent)) !important;
        }
        .leaflet-control-attribution {
          background: hsl(var(--card) / 0.8) !important;
          color: hsl(var(--muted-foreground)) !important;
        }
        .custom-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>

      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ width: '100%', height: '100%', minHeight: '500px' }}
        worldCopyJump
        ref={mapRef}
      >
        <MapController center={mapCenter} zoom={mapZoom} />
        
        <LayersControl position="topright">
          {/* Base Layers */}
          <LayersControl.BaseLayer checked name="Dark">
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
          </LayersControl.BaseLayer>
          
          <LayersControl.BaseLayer name="Satellite">
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>
          
          <LayersControl.BaseLayer name="Terrain">
            <TileLayer
              attribution='&copy; <a href="https://www.opentopomap.org/">OpenTopoMap</a>'
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          
          <LayersControl.BaseLayer name="Street">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="Watercolor">
            <TileLayer
              attribution='&copy; <a href="http://stamen.com">Stamen Design</a>'
              url="https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg"
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        {/* Anomaly markers */}
        {filteredAnomalies.map((anomaly) => (
          <AnomalyMarker
            key={anomaly.id}
            anomaly={anomaly}
            isSelected={selectedAnomaly?.id === anomaly.id}
            onClick={() => handleAnomalyClick(anomaly)}
          />
        ))}
      </MapContainer>

      {/* Overlay effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Scanline effect */}
        <motion.div
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
          animate={{ top: ['0%', '100%', '0%'] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        />
        
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-primary/40" />
        <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-primary/40" />
        <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-primary/40" />
        <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-primary/40" />
      </div>
    </div>
  );
};

export default memo(LeafletMap);
