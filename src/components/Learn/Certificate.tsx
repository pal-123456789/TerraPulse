import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Award, Download, X } from "lucide-react";
import { toast } from "sonner";

interface CertificateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientName: string;
  courseTitle: string;
  completedAt?: Date;
}

/**
 * Printable / downloadable certificate for completed courses.
 * Signed by the TerraGuardians team and founder Pal Ghevariya.
 *
 * Implemented as inline SVG so users can download it as an SVG file
 * without adding any heavy canvas/PDF dependency.
 */
const Certificate = ({
  open,
  onOpenChange,
  recipientName,
  courseTitle,
  completedAt = new Date(),
}: CertificateProps) => {
  const svgRef = useRef<SVGSVGElement>(null);

  const certificateId = `TG-${completedAt.getFullYear()}-${Math.abs(
    hashString(`${recipientName}|${courseTitle}`)
  )
    .toString(36)
    .toUpperCase()
    .slice(0, 8)}`;

  const dateStr = completedAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleDownload = () => {
    if (!svgRef.current) return;
    try {
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgRef.current);
      const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `TerraGuardians-Certificate-${recipientName.replace(/\s+/g, "_")}.svg`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Certificate downloaded");
    } catch {
      toast.error("Failed to download certificate");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl glass-ultra border-primary/30 p-0 overflow-hidden">
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="absolute top-3 right-3 z-10"
            aria-label="Close certificate"
          >
            <X className="w-4 h-4" />
          </Button>

          <svg
            ref={svgRef}
            viewBox="0 0 1200 850"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto"
            role="img"
            aria-label={`Certificate of completion for ${recipientName}, ${courseTitle}`}
          >
            <defs>
              <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0a1024" />
                <stop offset="100%" stopColor="#0e1b3a" />
              </linearGradient>
              <linearGradient id="ring" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#00d9ff" />
                <stop offset="50%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#00d9ff" />
              </linearGradient>
              <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f6d365" />
                <stop offset="100%" stopColor="#c08a2e" />
              </linearGradient>
            </defs>

            <rect width="1200" height="850" fill="url(#bg)" />
            {/* Decorative rings */}
            <rect
              x="30"
              y="30"
              width="1140"
              height="790"
              fill="none"
              stroke="url(#ring)"
              strokeWidth="3"
              rx="18"
            />
            <rect
              x="55"
              y="55"
              width="1090"
              height="740"
              fill="none"
              stroke="#1e293b"
              strokeWidth="1"
              rx="14"
            />

            {/* Header */}
            <g transform="translate(600,140)" textAnchor="middle">
              <circle r="42" fill="none" stroke="url(#gold)" strokeWidth="3" />
              <text y="14" fontFamily="serif" fontSize="40" fill="url(#gold)" fontWeight="700">
                TG
              </text>
            </g>
            <text
              x="600"
              y="230"
              textAnchor="middle"
              fontFamily="'Georgia', serif"
              fontSize="44"
              fill="#e6f7ff"
              fontWeight="700"
              letterSpacing="3"
            >
              TERRAGUARDIANS
            </text>
            <text
              x="600"
              y="265"
              textAnchor="middle"
              fontFamily="sans-serif"
              fontSize="16"
              fill="#7dd3fc"
              letterSpacing="6"
            >
              GLOBAL ENVIRONMENTAL INTELLIGENCE
            </text>

            <line x1="350" y1="295" x2="850" y2="295" stroke="#334155" strokeWidth="1" />

            {/* Title */}
            <text
              x="600"
              y="350"
              textAnchor="middle"
              fontFamily="'Georgia', serif"
              fontSize="34"
              fill="#f1f5f9"
              fontWeight="600"
            >
              Certificate of Completion
            </text>
            <text
              x="600"
              y="395"
              textAnchor="middle"
              fontFamily="sans-serif"
              fontSize="16"
              fill="#94a3b8"
            >
              This certificate is proudly presented to
            </text>

            {/* Recipient */}
            <text
              x="600"
              y="470"
              textAnchor="middle"
              fontFamily="'Georgia', serif"
              fontSize="54"
              fill="url(#ring)"
              fontWeight="700"
            >
              {recipientName}
            </text>
            <line x1="280" y1="495" x2="920" y2="495" stroke="#334155" strokeWidth="1" />

            <text
              x="600"
              y="540"
              textAnchor="middle"
              fontFamily="sans-serif"
              fontSize="16"
              fill="#cbd5e1"
            >
              for successfully completing the course
            </text>
            <text
              x="600"
              y="585"
              textAnchor="middle"
              fontFamily="'Georgia', serif"
              fontSize="28"
              fill="#67e8f9"
              fontWeight="600"
            >
              {courseTitle}
            </text>

            <text
              x="600"
              y="630"
              textAnchor="middle"
              fontFamily="sans-serif"
              fontSize="14"
              fill="#94a3b8"
            >
              demonstrating mastery of environmental science and anomaly detection.
            </text>

            {/* Signatures */}
            <g transform="translate(220,720)" textAnchor="middle">
              <text
                fontFamily="'Brush Script MT', cursive"
                fontSize="32"
                fill="#f1f5f9"
              >
                Pal Ghevariya
              </text>
              <line x1="-110" y1="14" x2="110" y2="14" stroke="#475569" strokeWidth="1" />
              <text y="34" fontFamily="sans-serif" fontSize="13" fill="#cbd5e1" fontWeight="600">
                Pal Ghevariya
              </text>
              <text y="52" fontFamily="sans-serif" fontSize="11" fill="#94a3b8">
                Founder, TerraGuardians
              </text>
            </g>

            <g transform="translate(980,720)" textAnchor="middle">
              <text
                fontFamily="'Brush Script MT', cursive"
                fontSize="32"
                fill="#f1f5f9"
              >
                TerraGuardians
              </text>
              <line x1="-130" y1="14" x2="130" y2="14" stroke="#475569" strokeWidth="1" />
              <text y="34" fontFamily="sans-serif" fontSize="13" fill="#cbd5e1" fontWeight="600">
                TerraGuardians Team
              </text>
              <text y="52" fontFamily="sans-serif" fontSize="11" fill="#94a3b8">
                Certification Authority
              </text>
            </g>

            {/* Seal */}
            <g transform="translate(600,720)">
              <circle r="44" fill="none" stroke="url(#gold)" strokeWidth="2.5" />
              <circle r="34" fill="none" stroke="url(#gold)" strokeWidth="1" />
              <text
                textAnchor="middle"
                y="-4"
                fontFamily="sans-serif"
                fontSize="10"
                fill="#f6d365"
                fontWeight="700"
                letterSpacing="2"
              >
                OFFICIAL
              </text>
              <text
                textAnchor="middle"
                y="14"
                fontFamily="serif"
                fontSize="18"
                fill="#f6d365"
                fontWeight="700"
              >
                TG
              </text>
              <text
                textAnchor="middle"
                y="30"
                fontFamily="sans-serif"
                fontSize="8"
                fill="#f6d365"
                letterSpacing="1"
              >
                {completedAt.getFullYear()}
              </text>
            </g>

            {/* Footer meta */}
            <text
              x="60"
              y="810"
              fontFamily="sans-serif"
              fontSize="11"
              fill="#64748b"
            >
              Certificate ID: {certificateId}
            </text>
            <text
              x="1140"
              y="810"
              textAnchor="end"
              fontFamily="sans-serif"
              fontSize="11"
              fill="#64748b"
            >
              Issued: {dateStr}
            </text>
          </svg>
        </div>

        <div className="p-4 flex items-center justify-between border-t border-border/50 bg-card/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Award className="w-4 h-4 text-primary" />
            Signed by Pal Ghevariya and the TerraGuardians team
          </div>
          <Button onClick={handleDownload} className="gap-2">
            <Download className="w-4 h-4" />
            Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

function hashString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return h;
}

export default Certificate;
