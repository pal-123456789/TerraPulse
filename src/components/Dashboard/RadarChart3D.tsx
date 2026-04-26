 import { Card } from "@/components/ui/card";
 import { motion } from "framer-motion";
 import { 
   RadarChart, 
   PolarGrid, 
   PolarAngleAxis, 
   PolarRadiusAxis, 
   Radar, 
   ResponsiveContainer,
   Legend
 } from "recharts";
 
 const data = [
   { subject: 'Seismic', A: 85, B: 78, fullMark: 100 },
   { subject: 'Weather', A: 92, B: 88, fullMark: 100 },
   { subject: 'Oceanic', A: 78, B: 82, fullMark: 100 },
   { subject: 'Volcanic', A: 65, B: 70, fullMark: 100 },
   { subject: 'Atmospheric', A: 88, B: 85, fullMark: 100 },
   { subject: 'Solar', A: 72, B: 68, fullMark: 100 },
 ];
 
 export const RadarChart3D = () => {
   return (
     <motion.div
       initial={{ opacity: 0, scale: 0.9 }}
       whileInView={{ opacity: 1, scale: 1 }}
       viewport={{ once: true }}
     >
       <Card className="glass-panel p-6 glow-border-hover">
         <h3 className="text-xl font-bold mb-4 text-foreground flex items-center gap-2">
           🎯 Detection Coverage by Category
         </h3>
         <ResponsiveContainer width="100%" height={300}>
           <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
             <PolarGrid stroke="hsl(var(--border))" />
             <PolarAngleAxis 
               dataKey="subject" 
               tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
             />
             <PolarRadiusAxis 
               angle={30} 
               domain={[0, 100]} 
               tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
             />
             <Radar 
               name="Current" 
               dataKey="A" 
               stroke="hsl(var(--primary))" 
               fill="hsl(var(--primary))" 
               fillOpacity={0.3} 
             />
             <Radar 
               name="Target" 
               dataKey="B" 
               stroke="#9b59b6" 
               fill="#9b59b6" 
               fillOpacity={0.2} 
             />
             <Legend />
           </RadarChart>
         </ResponsiveContainer>
       </Card>
     </motion.div>
   );
 };
 
 export default RadarChart3D;