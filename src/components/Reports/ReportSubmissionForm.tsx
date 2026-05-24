import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MapPin, Upload, Send } from "lucide-react";
import { reportSchema } from "@/lib/validationSchemas";

export const ReportSubmissionForm = () => {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState("");
  const [description, setDescription] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const reportTypes = [
    "Temperature Anomaly",
    "Unusual Weather",
    "Wildlife Behavior",
    "Water Quality",
    "Air Quality",
    "Seismic Activity",
    "Other"
  ];

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      toast.info("Getting your location...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toFixed(6));
          setLongitude(position.coords.longitude.toFixed(6));
          toast.success("Location captured!");
        },
        (error) => {
          toast.error("Failed to get location: " + error.message);
        }
      );
    } else {
      toast.error("Geolocation is not supported by your browser");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please sign in to submit a report");
        return;
      }

      // Validate form data
      const validationResult = reportSchema.safeParse({
        reportType,
        description,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        imageFile,
      });

      if (!validationResult.success) {
        const errors = validationResult.error.errors.map(e => e.message).join(", ");
        toast.error(errors);
        return;
      }

      let imageUrl = null;

      // Upload image if provided
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('report-images')
          .upload(fileName, imageFile);

        if (uploadError) {
          console.error("Image upload error:", uploadError);
          toast.warning("Report submitted but image upload failed");
        } else {
          const { data } = supabase.storage
            .from('report-images')
            .getPublicUrl(fileName);
          imageUrl = data.publicUrl;
        }
      }

      // Insert report
      const { error: insertError } = await supabase
        .from("user_reports")
        .insert({
          user_id: user.id,
          report_type: reportType,
          description,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          image_url: imageUrl,
        });

      if (insertError) throw insertError;

      toast.success("Report submitted successfully!");
      
      // Reset form
      setReportType("");
      setDescription("");
      setLatitude("");
      setLongitude("");
      setImageFile(null);
    } catch (error: any) {
      console.error("Error submitting report:", error);
      toast.error(error.message || "Failed to submit report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass-panel p-6">
      <h3 className="text-xl font-bold mb-4 text-foreground">Submit Environmental Report</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="report-type">Report Type</Label>
          <Select value={reportType} onValueChange={setReportType} required>
            <SelectTrigger id="report-type">
              <SelectValue placeholder="Select type..." />
            </SelectTrigger>
            <SelectContent>
              {reportTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Describe what you observed..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            maxLength={5000}
          />
          <p className="text-xs text-muted-foreground">{description.length}/5000 characters</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="latitude">Latitude</Label>
            <Input
              id="latitude"
              type="number"
              step="any"
              placeholder="e.g., 40.7128"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="longitude">Longitude</Label>
            <Input
              id="longitude"
              type="number"
              step="any"
              placeholder="e.g., -74.0060"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              required
            />
          </div>
        </div>

        <Button
          type="button"
          onClick={getCurrentLocation}
          variant="outline"
          className="w-full"
        >
          <MapPin className="w-4 h-4 mr-2" />
          Use My Current Location
        </Button>

        <div className="space-y-2">
          <Label htmlFor="image">Upload Image (Optional)</Label>
          <Input
            id="image"
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file && file.size > 5 * 1024 * 1024) {
                toast.error("Image must be less than 5MB");
                e.target.value = "";
                return;
              }
              setImageFile(file || null);
            }}
            className="cursor-pointer"
          />
          <p className="text-xs text-muted-foreground">Max size: 5MB. Formats: JPEG, PNG, WebP</p>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            "Submitting..."
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Submit Report
            </>
          )}
        </Button>
      </form>
    </Card>
  );
};

export default ReportSubmissionForm;