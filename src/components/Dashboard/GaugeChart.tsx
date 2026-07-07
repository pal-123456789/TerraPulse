 import { Card } from "@/components/ui/card";
 import { motion } from "framer-motion";
 
 interface GaugeChartProps {
   value: number;
   max: number;
   label: string;
   unit: string;
   color: string;
 }
 
 export const GaugeChart = ({ value, max, label, unit, color }: GaugeChartProps) => {
   const percentage = (value / max) * 100;
   const rotation = (percentage / 100) * 180 - 90; // -90 to 90 degrees
   
   return (
     <div className="flex flex-col items-center">
       <div className="relative w-32 h-16 overflow-hidden">
         {/* Background arc */}
         <div 
           className="absolute inset-0 rounded-t-full border-8 border-b-0"
           style={{ borderColor: 'hsl(var(--muted))' }}
         />
         
         {/* Colored arc */}
         <motion.div 
           className="absolute inset-0 rounded-t-full border-8 border-b-0 origin-bottom"
           style={{ 
             borderColor: color,
             clipPath: `polygon(0 0, 100% 0, 100% 100%, 50% 100%, 0 100%)`,
           }}
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ duration: 0.5 }}
         />
         
         {/* Needle */}
         <motion.div 
           className="absolute bottom-0 left-1/2 w-1 h-12 origin-bottom"
           style={{ backgroundColor: color }}
           initial={{ rotate: -90 }}
           animate={{ rotate: rotation }}
           transition={{ duration: 1, ease: "easeOut" }}
         />
         
         {/* Center circle */}
         <div 
           className="absolute bottom-0 left-1/2 w-3 h-3 rounded-full -translate-x-1/2 translate-y-1/2"
           style={{ backgroundColor: color }}
         />
       </div>
       
       <div className="text-center mt-2">
         <p className="text-2xl font-bold text-foreground">{value}{unit}</p>
         <p className="text-sm text-muted-foreground">{label}</p>
       </div>
     </div>
   );
 };
 
 export const GaugeChartGroup = () => {
   return (
     <Card className="glass-panel p-6 glow-border-hover">
       <h3 className="text-xl font-bold mb-6 text-foreground flex items-center gap-2">
         ⚡ System Performance Metrics
       </h3>
       <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
         <GaugeChart 
           value={95} 
           max={100} 
           label="API Uptime" 
           unit="%" 
           color="hsl(var(--primary))"
         />
         <GaugeChart 
           value={87} 
           max={100} 
           label="Data Accuracy" 
           unit="%" 
           color="#22c55e"
         />
         <GaugeChart 
           value={42} 
           max={100} 
           label="CPU Usage" 
           unit="%" 
           color="#eab308"
         />
         <GaugeChart 
           value={68} 
           max={100} 
           label="Memory" 
           unit="%" 
           color="#9b59b6"
         />
       </div>
     </Card>
   );
 };
 
 export default GaugeChartGroup;