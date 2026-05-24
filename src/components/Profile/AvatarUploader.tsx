import { useRef, useState } from "react";
import { Camera, Loader2, Upload } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AvatarUploaderProps {
  userId: string;
  currentUrl: string;
  fallback: React.ReactNode;
  onUploaded: (url: string) => void;
}

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export const AvatarUploader = ({ userId, currentUrl, fallback, onUploaded }: AvatarUploaderProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handlePick = () => inputRef.current?.click();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image must be smaller than 5 MB");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${userId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = pub.publicUrl;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", userId);

      if (updateError) throw updateError;

      onUploaded(publicUrl);
      toast.success("Profile photo updated");
    } catch (err: any) {
      console.error("Avatar upload failed:", err);
      toast.error(err?.message || "Failed to upload photo");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:blur-2xl transition-all" />
      <Avatar className="w-24 h-24 border-4 border-background relative z-10">
        <AvatarImage src={currentUrl} alt="Profile" />
        <AvatarFallback className="bg-primary/20 text-primary text-2xl">
          {fallback}
        </AvatarFallback>
      </Avatar>

      <button
        type="button"
        onClick={handlePick}
        disabled={uploading}
        aria-label="Change profile photo"
        className="absolute -bottom-1 -right-1 z-20 w-9 h-9 rounded-full bg-primary text-primary-foreground border-2 border-background flex items-center justify-center shadow-lg hover:scale-110 transition-transform disabled:opacity-60"
      >
        {uploading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Camera className="w-4 h-4" />
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
};

export default AvatarUploader;
