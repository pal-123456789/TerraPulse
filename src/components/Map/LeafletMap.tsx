import { useEffect, useState, useCallback, memo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import AnomalyConnections from './AnomalyConnections';
import { 
  AlertTriangle, 
  Thermometer, 
  Wind, 
  Droplets, 
  Activity,
  Flame,
  Zap,
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

// Custom icon creator with 3D-like effects
const createCustomIcon = (severity: string, isAnimated: boolean = true) => {
  const colors: Record<string, string> = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#3b82f6',
  };
  const color = colors[severity.toLowerCase()] || colors.low;
  
  return L.divIcon({
    className: 'custom-marker-3d',
    html: `
      <div class="marker-3d-container" style="position: relative; width: 32px; height: 32px;">
        <!-- Outer glow ring -->
        <div style="
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          background: radial-gradient(circle, ${color}40 0%, transparent 70%);
          ${isAnimated ? 'animation: pulse-glow 2s ease-in-out infinite;' : ''}
        "></div>
        <!-- Middle pulse ring -->
        <div style="
          position: absolute;
          inset: 0;
          border: 2px solid ${color};
          border-radius: 50%;
          opacity: 0.5;
          ${isAnimated ? 'animation: pulse-ring 2s ease-out infinite;' : ''}
        "></div>
        <!-- Core marker -->
        <div style="
          position: absolute;
          inset: 4px;
          background: ${color};
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 0 20px ${color}, 0 4px 8px rgba(0,0,0,0.3), inset 0 -2px 4px rgba(0,0,0,0.2);
          ${isAnimated ? 'animation: pulse-core 2s ease-in-out infinite;' : ''}
        "></div>
        <!-- Inner highlight -->
        <div style="
          position: absolute;
          top: 6px;
          left: 8px;
          width: 8px;
          height: 8px;
          background: rgba(255,255,255,0.4);
          border-radius: 50%;
          filter: blur(2px);
        "></div>
      </div>
      <style>
        @keyframes pulse-glow {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.3); opacity: 0.3; }
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(2); opacity: 0; }
        }
        @keyframes pulse-core {
          0%, 100% { transform: scale(1); box-shadow: 0 0 20px ${color}, 0 4px 8px rgba(0,0,0,0.3); }
          50% { transform: scale(1.1); box-shadow: 0 0 30px ${color}, 0 4px 12px rgba(0,0,0,0.4); }
        }
      </style>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
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
      {/* Outer animated pulse circle */}
      <Circle
        center={position}
        radius={getSeverityRadius(anomaly.severity)}
        pathOptions={{
          color: color,
          fillColor: color,
          fillOpacity: 0.1,
          weight: 1,
          dashArray: '5, 5',
        }}
      />
      {/* Inner glow circle */}
      <Circle
        center={position}
        radius={getSeverityRadius(anomaly.severity) * 0.4}
        pathOptions={{
          color: color,
          fillColor: color,
          fillOpacity: 0.2,
          weight: 0,
        }}
      />
      {/* Marker */}
      <Marker
        position={position}
        icon={createCustomIcon(anomaly.severity, true)}
        eventHandlers={{ click: onClick }}
      >
        <Popup className="anomaly-popup">
          <div className="p-3 min-w-[280px] bg-background/95 backdrop-blur-sm rounded-lg border border-border">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}20`, color: color }}>
                {getTypeIcon(anomaly.anomaly_type)}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-foreground">{anomaly.name}</h4>
                <Badge 
                  variant="outline" 
                  className="text-[10px] mt-1"
                  style={{ borderColor: color, color: color }}
                >
                  {anomaly.severity.toUpperCase()}
                </Badge>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{anomaly.description}</p>
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
            <div className="flex items-center gap-2 mt-3">
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

// Generate many mock anomalies for demonstration
const generateMockAnomalies = (): Anomaly[] => {
  const types = ['weather', 'seismic', 'temperature', 'pollution', 'volcanic', 'flood', 'magnetic', 'drought'];
  const severities = ['critical', 'high', 'medium', 'low'];
  const statuses = ['active', 'monitoring', 'resolved'];
  
  const baseAnomalies: Anomaly[] = [
    { id: '1', name: 'Tropical Storm Formation', description: 'Unusual atmospheric pressure changes detected', latitude: 25.7617, longitude: -80.1918, severity: 'critical', anomaly_type: 'weather', status: 'active', detected_at: new Date().toISOString() },
    { id: '2', name: 'Seismic Activity Alert', description: 'Minor tremors detected in fault zone', latitude: 35.6762, longitude: 139.6503, severity: 'high', anomaly_type: 'seismic', status: 'active', detected_at: new Date().toISOString() },
    { id: '3', name: 'Ocean Temperature Anomaly', description: 'Above average ocean surface temperature', latitude: -33.8688, longitude: 151.2093, severity: 'medium', anomaly_type: 'temperature', status: 'monitoring', detected_at: new Date().toISOString() },
    { id: '4', name: 'Air Quality Warning', description: 'Elevated particulate matter detected', latitude: 51.5074, longitude: -0.1278, severity: 'high', anomaly_type: 'pollution', status: 'active', detected_at: new Date().toISOString() },
    { id: '5', name: 'Volcanic Activity', description: 'Increased volcanic emissions observed', latitude: -8.4095, longitude: 115.1889, severity: 'critical', anomaly_type: 'volcanic', status: 'active', detected_at: new Date().toISOString() },
    { id: '6', name: 'Drought Conditions', description: 'Extended dry period affecting region', latitude: -25.2744, longitude: 133.7751, severity: 'medium', anomaly_type: 'drought', status: 'monitoring', detected_at: new Date().toISOString() },
    { id: '7', name: 'Flooding Risk', description: 'Heavy rainfall causing river levels to rise', latitude: 13.7563, longitude: 100.5018, severity: 'high', anomaly_type: 'flood', status: 'active', detected_at: new Date().toISOString() },
    { id: '8', name: 'Geomagnetic Storm', description: 'Solar wind disturbance affecting satellites', latitude: 64.1466, longitude: -21.9426, severity: 'low', anomaly_type: 'magnetic', status: 'monitoring', detected_at: new Date().toISOString() },
    { id: '9', name: 'Wildfire Alert', description: 'High fire danger due to dry conditions', latitude: 34.0522, longitude: -118.2437, severity: 'critical', anomaly_type: 'fire', status: 'active', detected_at: new Date().toISOString() },
    { id: '10', name: 'Glacier Melt', description: 'Accelerated ice loss detected', latitude: 78.2232, longitude: 15.6469, severity: 'medium', anomaly_type: 'climate', status: 'monitoring', detected_at: new Date().toISOString() },
  ];

  // Generate additional random anomalies
  const additionalAnomalies: Anomaly[] = [];
  for (let i = 11; i <= 100; i++) {
    additionalAnomalies.push({
      id: String(i),
      name: `Anomaly Zone ${i}`,
      description: `Environmental anomaly detected in monitoring zone ${i}`,
      latitude: (Math.random() * 140) - 70,
      longitude: (Math.random() * 360) - 180,
      severity: severities[Math.floor(Math.random() * severities.length)],
      anomaly_type: types[Math.floor(Math.random() * types.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      detected_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  return [...baseAnomalies, ...additionalAnomalies];
};

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

      if (!error && data && data.length > 0) {
        setAnomalies(data);
      } else {
        // Use generated mock data with many points
        setAnomalies(generateMockAnomalies());
      }
    };

    fetchAnomalies();

    // Real-time subscription
    const channel = supabase
      .channel('map-anomalies-live')
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
        .custom-marker-3d {
          background: transparent !important;
          border: none !important;
        }
        .anomaly-connection {
          stroke-dashoffset: 0;
          animation: dash-flow 20s linear infinite;
        }
        @keyframes dash-flow {
          to {
            stroke-dashoffset: -1000;
          }
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
        
        {/* Animated connections between anomalies */}
        <AnomalyConnections anomalies={filteredAnomalies} />
        
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

      {/* Stats overlay */}
      <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm rounded-lg p-3 border border-border/50">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-muted-foreground">{filteredAnomalies.length} Active Points</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-muted-foreground">Live Connections</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(LeafletMap);