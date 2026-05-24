import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Satellite, Radio, MapPin, Gauge, Globe, RefreshCw, ExternalLink, Camera } from 'lucide-react';

interface SatelliteData {
  id: string;
  name: string;
  position: { lat: number; lon: number; alt: number };
  velocity: number;
  status: 'active' | 'tracking' | 'idle';
}

interface SatelliteDetailModalProps {
  satellite: SatelliteData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SATELLITE_INFO: Record<string, {
  description: string;
  instruments: string[];
  launchDate: string;
  orbit: string;
  nasaId: string;
  imageKeyword: string;
}> = {
  'sat-1': {
    description: 'Terra is the flagship satellite of NASA\'s Earth Observing System (EOS). It carries five instruments that observe Earth\'s atmosphere, ocean, land, snow, and ice.',
    instruments: ['MODIS', 'ASTER', 'CERES', 'MISR', 'MOPITT'],
    launchDate: 'December 18, 1999',
    orbit: 'Sun-synchronous, descending node at 10:30 AM',
    nasaId: 'terra',
    imageKeyword: 'terra satellite earth'
  },
  'sat-2': {
    description: 'Aqua carries six instruments to observe Earth\'s water cycle including evaporation, precipitation, and sea ice. It is a key part of the "A-Train" constellation.',
    instruments: ['MODIS', 'AMSR-E', 'AIRS', 'AMSU-A', 'HSB', 'CERES'],
    launchDate: 'May 4, 2002',
    orbit: 'Sun-synchronous, ascending node at 1:30 PM',
    nasaId: 'aqua',
    imageKeyword: 'aqua satellite ocean'
  },
  'sat-3': {
    description: 'Aura\'s mission is to study Earth\'s ozone layer, air quality, and climate. It provides critical data on atmospheric composition and chemistry.',
    instruments: ['HIRDLS', 'MLS', 'OMI', 'TES'],
    launchDate: 'July 15, 2004',
    orbit: 'Sun-synchronous, ascending node at 1:45 PM',
    nasaId: 'aura',
    imageKeyword: 'aura satellite atmosphere'
  },
  'sat-4': {
    description: 'NOAA-20 (JPSS-1) provides continuity of critical weather and environmental observations. It helps forecast severe weather events and track environmental hazards.',
    instruments: ['VIIRS', 'CrIS', 'ATMS', 'OMPS', 'CERES'],
    launchDate: 'November 18, 2017',
    orbit: 'Sun-synchronous, 824 km altitude',
    nasaId: 'noaa20',
    imageKeyword: 'noaa satellite weather'
  }
};

const SatelliteDetailModal = ({ satellite, open, onOpenChange }: SatelliteDetailModalProps) => {
  const [nasaImage, setNasaImage] = useState<string | null>(null);
  const [epicImages, setEpicImages] = useState<{ url: string; date: string; caption: string }[]>([]);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  const info = satellite ? SATELLITE_INFO[satellite.id] : null;

  useEffect(() => {
    if (open && satellite) {
      fetchSatelliteImagery();
    }
    return () => {
      setNasaImage(null);
      setEpicImages([]);
      setActiveImageIndex(0);
      setImageError(false);
    };
  }, [open, satellite?.id]);

  const fetchSatelliteImagery = async () => {
    if (!satellite) return;
    setIsLoadingImage(true);
    setImageError(false);

    try {
      // Fetch NASA EPIC (Earth Polychromatic Imaging Camera) images
      const epicRes = await fetch(
        `https://epic.gsfc.nasa.gov/api/natural?api_key=DEMO_KEY`
      );
      
      if (epicRes.ok) {
        const epicData = await epicRes.json();
        const images = epicData.slice(0, 6).map((item: any) => {
          const date = item.date.split(' ')[0].replaceAll('-', '/');
          return {
            url: `https://epic.gsfc.nasa.gov/archive/natural/${date}/png/${item.image}.png`,
            date: item.date,
            caption: item.caption || 'Earth from DSCOVR EPIC camera'
          };
        });
        setEpicImages(images);
      }

      // Also fetch NASA Earth imagery for satellite's current position
      const lat = satellite.position.lat.toFixed(2);
      const lon = satellite.position.lon.toFixed(2);
      const earthUrl = `https://api.nasa.gov/planetary/earth/imagery?lon=${lon}&lat=${lat}&dim=0.3&api_key=DEMO_KEY`;
      setNasaImage(earthUrl);
    } catch (error) {
      console.error('Error fetching satellite imagery:', error);
      setImageError(true);
    } finally {
      setIsLoadingImage(false);
    }
  };

  if (!satellite || !info) return null;

  const statusColor = satellite.status === 'active' 
    ? 'bg-green-500/20 text-green-400 border-green-500/30' 
    : satellite.status === 'tracking' 
    ? 'bg-primary/20 text-primary border-primary/30' 
    : 'bg-muted/20 text-muted-foreground border-muted/30';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="w-10 h-10 bg-gradient-to-br from-primary/30 to-primary/10 rounded-lg flex items-center justify-center">
              <Satellite className="w-5 h-5 text-primary" />
            </div>
            <div>
              <span className="text-foreground">{satellite.name}</span>
              <Badge variant="outline" className={`ml-3 text-xs ${statusColor}`}>
                {satellite.status === 'active' && <Radio className="w-3 h-3 mr-1 animate-pulse" />}
                {satellite.status.toUpperCase()}
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Satellite Imagery Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Camera className="w-4 h-4 text-primary" />
            Live Earth View from Satellite
          </div>

          {/* EPIC Images Carousel */}
          {epicImages.length > 0 ? (
            <div className="space-y-3">
              <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-background/50 border border-border/50">
                <img
                  src={epicImages[activeImageIndex]?.url}
                  alt={epicImages[activeImageIndex]?.caption}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent p-3">
                  <p className="text-xs text-muted-foreground">{epicImages[activeImageIndex]?.caption}</p>
                  <p className="text-xs text-primary font-mono">{epicImages[activeImageIndex]?.date}</p>
                </div>
                <div className="absolute top-2 right-2">
                  <Badge className="bg-red-500/80 text-white border-none text-xs animate-pulse">
                    <Radio className="w-3 h-3 mr-1" /> LIVE
                  </Badge>
                </div>
              </div>

              {/* Thumbnail strip */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {epicImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
                      idx === activeImageIndex 
                        ? 'border-primary ring-1 ring-primary/50' 
                        : 'border-border/50 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          ) : isLoadingImage ? (
            <div className="w-full aspect-video rounded-lg bg-background/50 border border-border/50 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Loading satellite imagery...</p>
              </div>
            </div>
          ) : (
            <div className="w-full aspect-video rounded-lg bg-background/50 border border-border/50 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Imagery unavailable</p>
            </div>
          )}

          {/* Earth Surface Image at satellite position */}
          {nasaImage && !imageError && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Globe className="w-4 h-4 text-primary" />
                Earth Surface at Satellite Position ({satellite.position.lat.toFixed(1)}°, {satellite.position.lon.toFixed(1)}°)
              </div>
              <div className="relative w-full h-48 rounded-lg overflow-hidden bg-background/50 border border-border/50">
                <img
                  src={nasaImage}
                  alt={`Earth surface at ${satellite.position.lat.toFixed(1)}°, ${satellite.position.lon.toFixed(1)}°`}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
                <div className="absolute top-2 left-2">
                  <Badge variant="outline" className="bg-background/70 text-foreground border-border/50 text-xs">
                    <MapPin className="w-3 h-3 mr-1" />
                    Landsat Imagery
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Satellite Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-background/50 border border-border/50">
              <div className="flex items-center gap-1.5 mb-1">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs text-muted-foreground">Position</span>
              </div>
              <p className="text-sm font-mono font-bold text-foreground">
                {satellite.position.lat.toFixed(2)}°, {satellite.position.lon.toFixed(2)}°
              </p>
            </div>
            <div className="p-3 rounded-lg bg-background/50 border border-border/50">
              <div className="flex items-center gap-1.5 mb-1">
                <Globe className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs text-muted-foreground">Altitude</span>
              </div>
              <p className="text-sm font-mono font-bold text-foreground">{satellite.position.alt} km</p>
            </div>
            <div className="p-3 rounded-lg bg-background/50 border border-border/50">
              <div className="flex items-center gap-1.5 mb-1">
                <Gauge className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs text-muted-foreground">Velocity</span>
              </div>
              <p className="text-sm font-mono font-bold text-foreground">{satellite.velocity} km/s</p>
            </div>
            <div className="p-3 rounded-lg bg-background/50 border border-border/50">
              <div className="flex items-center gap-1.5 mb-1">
                <Satellite className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs text-muted-foreground">Launch</span>
              </div>
              <p className="text-xs font-bold text-foreground">{info.launchDate.split(',')[0]}</p>
            </div>
          </div>

          {/* Description */}
          <div className="p-4 rounded-lg bg-background/50 border border-border/50">
            <p className="text-sm text-muted-foreground leading-relaxed">{info.description}</p>
          </div>

          {/* Instruments */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-2">Onboard Instruments</p>
            <div className="flex flex-wrap gap-2">
              {info.instruments.map((inst) => (
                <Badge key={inst} variant="outline" className="bg-primary/5 border-primary/20 text-primary text-xs">
                  {inst}
                </Badge>
              ))}
            </div>
          </div>

          {/* Orbit Info */}
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-xs text-muted-foreground">Orbit Type</p>
            <p className="text-sm font-medium text-foreground">{info.orbit}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={fetchSatelliteImagery}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Imagery
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => window.open(`https://eyes.nasa.gov/apps/earth/#/satellites/${info.nasaId}`, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              NASA Eyes 3D View
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SatelliteDetailModal;
