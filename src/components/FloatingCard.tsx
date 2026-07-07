import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FloatingCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export const FloatingCard = ({ children, className, delay = 0 }: FloatingCardProps) => {
  return (
    <Card
      className={cn(
        "glass-panel glow-border-hover animate-float-3d",
        className
      )}
      style={{
        animationDelay: `${delay}s`,
        transform: 'perspective(1000px)',
      }}
    >
      {children}
    </Card>
  );
};
