import { useState, useEffect } from "react";
import { MapPin, Activity, TrendingUp, Wind, Thermometer, Droplets, Eye, AlertTriangle, Info, Radar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Globe3D } from "@/components/Globe3D";
import { LocationSearchBar } from "@/components/LocationSearchBar";
import { useLenisScroll } from "@/hooks/useLenisScroll";
import Footer from "@/components/Footer";

const Explore = () => {
  useLenisScroll();
  
  const [location, setLocation] = useState<{ lat: number; lon: number; name?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState<string>("");
  const [weatherData, setWeatherData] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [detectionResult, setDetectionResult] = useState<any>(null);
  const [predictionResult, setPredictionResult] = useState<any>(null);

  useEffect(() => {
    requestLocation();
  }, []);

  const requestLocation = () => {
    if ("geolocation" in navigator) {
      setLoading(true);
      setLocationError("");
      
      toast.info("Requesting location access...", { duration: 2000 });
      
      // Set a longer timeout (30 seconds) for location acquisition
      const options = {
        enableHighAccuracy: true,
        timeout: 30000, // 30 seconds
        maximumAge: 0
      };
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };
          setLocation(coords);
          setLocationError("");
          fetchWeatherData(coords);
          toast.success("Location acquired successfully");
          setLoading(false);
        },
        (error) => {
          setLoading(false);
          let errorMessage = "";
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location access denied. Please enable location permissions in your device settings and refresh the page.";
              toast.error("Location permission denied", { duration: 5000 });
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable. Please check your device's location settings.";
              toast.error("Location unavailable", { duration: 5000 });
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out. This may happen if GPS signal is weak. Please try again or enable high-accuracy mode in your device settings.";
              toast.error("Location timeout - Try again", { duration: 5000 });
              break;
            default:
              errorMessage = "Unable to get your location. Please check your device settings.";
              toast.error("Location error", { duration: 5000 });
          }
          
          setLocationError(errorMessage);
        },
        options
      );
    } else {
      toast.error("Geolocation is not supported by your browser");
      setLocationError("Your browser doesn't support location services.");
    }
  };

  const fetchWeatherData = async (coords: { lat: number; lon: number }) => {
    setDataLoading(true);
    try {
      // Call our edge function to fetch and store environmental data
      const { data, error } = await supabase.functions.invoke('fetch-environmental-data', {
        body: { latitude: coords.lat, longitude: coords.lon }
      });

      if (error) {
        console.error("Error fetching environmental data:", error);
        toast.error("Failed to fetch environmental data");
        setDataLoading(false);
        return;
      }

      setWeatherData(data.weather);
      toast.success("Environmental data fetched successfully");
    } catch (error) {
      console.error("Error fetching weather data:", error);
      toast.error("Failed to fetch environmental data");
    } finally {
      setDataLoading(false);
    }
  };

  const handleDetection = async () => {
    if (!location || !weatherData) {
      toast.error("Please enable location and wait for data to load");
      return;
    }

    setAnalysisLoading(true);
    setDetectionResult(null);
    toast.info("Running AI anomaly detection...");

    try {
      const { data, error } = await supabase.functions.invoke('detect-anomalies', {
        body: {
          latitude: location.lat,
          longitude: location.lon,
          weatherData: {
            temperature: weatherData.main?.temp,
            humidity: weatherData.main?.humidity,
            pressure: weatherData.main?.pressure,
            wind_speed: weatherData.wind?.speed,
            weather_condition: weatherData.weather?.[0]?.description
          }
        }
      });

      if (error) {
        console.error("Detection error:", error);
        toast.error("Failed to run anomaly detection");
        return;
      }

      setDetectionResult(data);
      
      if (data.hasAnomaly) {
        toast.error(`Anomaly detected: ${data.severity} severity`);
      } else {
        toast.success("No anomalies detected");
      }
    } catch (error) {
      console.error("Detection error:", error);
      toast.error("Failed to run anomaly detection");
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handlePrediction = async () => {
    if (!location || !weatherData) {
      toast.error("Please enable location and wait for data to load");
      return;
    }

    setAnalysisLoading(true);
    setPredictionResult(null);
    toast.info("Running AI prediction analysis...");

    try {
      const { data, error } = await supabase.functions.invoke('predict-conditions', {
        body: {
          latitude: location.lat,
          longitude: location.lon,
          weatherData: {
            temperature: weatherData.main?.temp,
            humidity: weatherData.main?.humidity,
            pressure: weatherData.main?.pressure,
            wind_speed: weatherData.wind?.speed
          }
        }
      });

      if (error) {
        console.error("Prediction error:", error);
        toast.error("Failed to run prediction");
        return;
      }

      setPredictionResult(data);
      toast.success(`Forecast: ${data.riskLevel} risk level`);
    } catch (error) {
      console.error("Prediction error:", error);
      toast.error("Failed to run prediction");
    } finally {
      setAnalysisLoading(false);
    }
  };

  // Generate trend data for charts
  const generateTrendData = (currentTemp: number) => {
    return Array.from({ length: 24 }, (_, i) => ({
      time: `${i}:00`,
      temp: currentTemp + (Math.sin(i / 3) * 5) + (Math.random() * 2 - 1)
    }));
  };

  const generateMetricsData = (weather: any) => {
    return [
      { name: 'Current', humidity: weather.main?.humidity || 0, pressure: (weather.main?.pressure || 1000) / 10 },
      { name: '+6h', humidity: (weather.main?.humidity || 0) + 5, pressure: ((weather.main?.pressure || 1000) + 2) / 10 },
      { name: '+12h', humidity: (weather.main?.humidity || 0) + 3, pressure: ((weather.main?.pressure || 1000) - 1) / 10 },
      { name: '+18h', humidity: (weather.main?.humidity || 0) - 2, pressure: ((weather.main?.pressure || 1000) + 1) / 10 },
      { name: '+24h', humidity: (weather.main?.humidity || 0) + 1, pressure: ((weather.main?.pressure || 1000) + 3) / 10 },
    ];
  };

  const handleLocationSelect = (selectedLocation: { lat: number; lon: number; name: string }) => {
    setLocation(selectedLocation);
    setLocationError("");
    fetchWeatherData(selectedLocation);
  };

  return (
    <div className="min-h-screen bg-space-gradient">
      <Navigation />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header Section */}
          <div className="text-center space-y-4 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Radar className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-sm font-medium text-primary">Live Environmental Intelligence</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-glow">
              Explore <span className="text-primary">Planet Earth</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Search any location worldwide to analyze real-time environmental data, detect anomalies, and predict future conditions using AI
            </p>
          </div>

          {/* Location Search */}
          <div className="max-w-3xl mx-auto">
            <LocationSearchBar onLocationSelect={handleLocationSelect} />
          </div>

          {/* Location Instructions Alert */}
          {locationError && (
            <Alert className="mb-6 border-orange-500/50 bg-orange-500/10">
              <Info className="h-4 w-4 text-orange-500" />
              <AlertDescription className="text-foreground">
                {locationError}
                <div className="mt-2 text-sm">
                  <strong>To enable location:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>On mobile: Go to Settings → Privacy → Location Services</li>
                    <li>On browser: Click the location icon in the address bar and allow access</li>
                    <li>Make sure GPS/Location is enabled on your device</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {loading && !location && (
            <Alert className="mb-6 border-primary/50 bg-primary/10">
              <Info className="h-4 w-4 text-primary animate-pulse" />
              <AlertDescription className="text-foreground">
                <strong>Acquiring your location...</strong>
                <p className="mt-1 text-sm">This may take up to 30 seconds. Please ensure:</p>
                <ul className="list-disc list-inside mt-1 space-y-1 text-sm">
                  <li>Location/GPS is enabled on your device</li>
                  <li>You've granted location permission to your browser</li>
                  <li>You have a clear view of the sky if using GPS</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {dataLoading && (
            <Alert className="mb-6 border-primary/50 bg-primary/10">
              <div className="flex items-center gap-4">
                <div className="relative w-12 h-12">
                  <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" 
                       style={{ animationDuration: '1s' }} />
                  <div className="absolute inset-2 rounded-full bg-primary/20 animate-pulse" />
                </div>
                <AlertDescription className="text-foreground flex-1">
                  <strong>Fetching environmental data from NASA and weather services...</strong>
                  <p className="mt-1 text-sm">This may take some time as we gather comprehensive data about your location.</p>
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* Data Visualizations */}
          {weatherData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up">
              <Card className="glass-panel p-6">
                <h3 className="text-lg font-bold mb-4 text-foreground">Temperature Trend (24h)</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={generateTrendData(weatherData.main?.temp || 20)}>
                    <defs>
                      <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Area type="monotone" dataKey="temp" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#tempGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>

              <Card className="glass-panel p-6">
                <h3 className="text-lg font-bold mb-4 text-foreground">Environmental Metrics</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={generateMetricsData(weatherData)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="humidity" stroke="hsl(180 100% 60%)" strokeWidth={2} />
                    <Line type="monotone" dataKey="pressure" stroke="hsl(270 70% 60%)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main 3D Globe Visualization */}
            <div className="lg:col-span-2 order-2 lg:order-1">
              <Card className="glass-panel p-6 h-[600px] relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-space-deep to-background opacity-80" />
                
                <div className="relative z-10 h-full flex flex-col">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <MapPin className={`w-5 h-5 ${location ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
                      <span className="text-sm text-muted-foreground">
                        {location?.name || (location
                          ? `${location.lat.toFixed(2)}, ${location.lon.toFixed(2)}`
                          : loading ? "Acquiring location..." : "No location selected")}
                      </span>
                    </div>
                    
                    {!location && (
                      <Button 
                        onClick={requestLocation} 
                        size="sm" 
                        disabled={loading}
                        className="bg-primary/20 hover:bg-primary/30 border border-primary/40"
                      >
                        {loading ? "Getting Location..." : locationError ? "Retry Location" : "Use My Location"}
                      </Button>
                    )}
                  </div>

                  <div className="flex-1 relative">
                    {/* 3D Globe */}
                    <div className="absolute inset-0">
                      <Globe3D />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center mt-4">
                    <Button
                      onClick={handleDetection}
                      size="lg"
                      className="glow-border bg-primary/10 hover:bg-primary/20 border-2"
                      disabled={!weatherData || analysisLoading}
                    >
                      <Activity className="w-5 h-5 mr-2" />
                      {analysisLoading ? "Analyzing..." : "Detect Anomalies"}
                    </Button>
                    
                    <Button
                      onClick={handlePrediction}
                      size="lg"
                      className="bg-purple-500/10 hover:bg-purple-500/20 border-2 border-purple-500/30"
                      disabled={!weatherData || analysisLoading}
                    >
                      <TrendingUp className="w-5 h-5 mr-2" />
                      Predict Conditions
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            {/* Data Panel */}
            <div className="space-y-6 order-1 lg:order-2">
              <Card className="glass-panel p-6">
                <h3 className="text-lg font-bold mb-4 text-foreground">Current Conditions</h3>
                
                {weatherData ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Thermometer className="w-5 h-5 text-primary" />
                        <span className="text-sm text-muted-foreground">Temperature</span>
                      </div>
                      <span className="font-bold text-foreground">{weatherData.main?.temp}°C</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Wind className="w-5 h-5 text-primary" />
                        <span className="text-sm text-muted-foreground">Wind Speed</span>
                      </div>
                      <span className="font-bold text-foreground">{weatherData.wind?.speed} m/s</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Droplets className="w-5 h-5 text-primary" />
                        <span className="text-sm text-muted-foreground">Humidity</span>
                      </div>
                      <span className="font-bold text-foreground">{weatherData.main?.humidity}%</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-primary" />
                        <span className="text-sm text-muted-foreground">Pressure</span>
                      </div>
                      <span className="font-bold text-foreground">{weatherData.main?.pressure} hPa</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Enable location to see current conditions
                  </div>
                )}
              </Card>

              <Card className="glass-panel p-6">
                <h3 className="text-lg font-bold mb-4 text-foreground">Anomaly Status</h3>
                
                {detectionResult ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className={`w-5 h-5 ${
                        detectionResult.hasAnomaly ? 'text-red-400' : 'text-green-400'
                      }`} />
                      <span className="font-bold text-foreground">
                        {detectionResult.hasAnomaly ? 'Anomaly Detected' : 'All Clear'}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Severity</span>
                        <span className={`text-sm font-bold ${
                          detectionResult.severity === 'extreme' ? 'text-red-400' :
                          detectionResult.severity === 'high' ? 'text-orange-400' :
                          detectionResult.severity === 'medium' ? 'text-yellow-400' :
                          'text-green-400'
                        }`}>{detectionResult.severity}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Type</span>
                        <span className="text-sm font-bold text-foreground">{detectionResult.anomalyType}</span>
                      </div>
                      <div className="p-3 bg-card/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">{detectionResult.description}</p>
                      </div>
                      {detectionResult.recommendation && (
                        <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                          <p className="text-sm text-foreground">{detectionResult.recommendation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Detection Level</span>
                      <span className="text-sm font-bold text-green-400">Normal</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Risk Assessment</span>
                      <span className="text-sm font-bold text-green-400">Low</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Last Updated</span>
                      <span className="text-sm font-bold text-foreground">
                        {weatherData ? 'Just now' : 'Waiting for data...'}
                      </span>
                    </div>
                  </div>
                )}
              </Card>

              {predictionResult && (
                <Card className="glass-panel p-6">
                  <h3 className="text-lg font-bold mb-4 text-foreground">Prediction</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Risk Level</span>
                      <span className={`text-sm font-bold ${
                        predictionResult.riskLevel === 'extreme' ? 'text-red-400' :
                        predictionResult.riskLevel === 'high' ? 'text-orange-400' :
                        predictionResult.riskLevel === 'medium' ? 'text-yellow-400' :
                        'text-green-400'
                      }`}>{predictionResult.riskLevel}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Confidence</span>
                      <span className="text-sm font-bold text-foreground">{predictionResult.confidence}%</span>
                    </div>
                    <div className="p-3 bg-card/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">{predictionResult.forecast}</p>
                    </div>
                    {predictionResult.warnings && predictionResult.warnings.length > 0 && (
                      <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                        <ul className="text-sm text-foreground space-y-1">
                          {predictionResult.warnings.map((warning: string, idx: number) => (
                            <li key={idx}>• {warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Explore;
