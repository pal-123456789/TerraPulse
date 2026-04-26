import { useEffect, useState, useRef, memo } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface Anomaly {
  id: string;
  latitude: number;
  longitude: number;
  severity: string;
}

interface AnomalyConnectionsProps {
  anomalies: Anomaly[];
}

const AnomalyConnections = memo(({ anomalies }: AnomalyConnectionsProps) => {
  const map = useMap();
  const linesRef = useRef<L.Polyline[]>([]);
  const [activeConnections, setActiveConnections] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (anomalies.length < 2) return;

    // Clear existing lines
    linesRef.current.forEach(line => line.remove());
    linesRef.current = [];

    const getSeverityColor = (severity: string) => {
      switch (severity.toLowerCase()) {
        case 'critical': return '#ef4444';
        case 'high': return '#f97316';
        case 'medium': return '#eab308';
        default: return '#3b82f6';
      }
    };

    // Create connections between nearby anomalies
    const connections: Array<{ from: Anomaly; to: Anomaly; distance: number }> = [];
    
    anomalies.forEach((a1, i) => {
      anomalies.slice(i + 1).forEach(a2 => {
        const distance = Math.sqrt(
          Math.pow(a1.latitude - a2.latitude, 2) + 
          Math.pow(a1.longitude - a2.longitude, 2)
        );
        // Connect if within reasonable distance
        if (distance < 50) {
          connections.push({ from: a1, to: a2, distance });
        }
      });
    });

    // Sort by distance and limit connections
    connections.sort((a, b) => a.distance - b.distance);
    const limitedConnections = connections.slice(0, Math.min(50, connections.length));

    // Animate connections appearing
    let connectionIndex = 0;
    const animationInterval = setInterval(() => {
      if (connectionIndex >= limitedConnections.length) {
        clearInterval(animationInterval);
        return;
      }

      const conn = limitedConnections[connectionIndex];
      const color = getSeverityColor(conn.from.severity);
      
      // Create animated polyline
      const line = L.polyline(
        [
          [conn.from.latitude, conn.from.longitude],
          [conn.to.latitude, conn.to.longitude]
        ],
        {
          color: color,
          weight: 2,
          opacity: 0,
          dashArray: '10, 10',
          className: 'anomaly-connection'
        }
      ).addTo(map);

      // Animate opacity
      let opacity = 0;
      const fadeIn = setInterval(() => {
        opacity += 0.1;
        if (opacity >= 0.6) {
          clearInterval(fadeIn);
          // Start pulse animation
          let pulseOpacity = 0.6;
          let pulseDirection = -1;
          const pulse = setInterval(() => {
            pulseOpacity += pulseDirection * 0.05;
            if (pulseOpacity <= 0.2) pulseDirection = 1;
            if (pulseOpacity >= 0.6) pulseDirection = -1;
            line.setStyle({ opacity: pulseOpacity });
          }, 100);

          // Store for cleanup
          (line as any)._pulseInterval = pulse;
        }
        line.setStyle({ opacity });
      }, 50);

      linesRef.current.push(line);
      setActiveConnections(prev => new Set([...prev, `${conn.from.id}-${conn.to.id}`]));
      connectionIndex++;
    }, 150); // New connection every 150ms

    return () => {
      clearInterval(animationInterval);
      linesRef.current.forEach(line => {
        if ((line as any)._pulseInterval) {
          clearInterval((line as any)._pulseInterval);
        }
        line.remove();
      });
      linesRef.current = [];
    };
  }, [anomalies, map]);

  return null;
});

AnomalyConnections.displayName = 'AnomalyConnections';

export default AnomalyConnections;