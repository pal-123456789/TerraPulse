 import { Card } from "@/components/ui/card";
 import { motion } from "framer-motion";
 import { 
   ScatterChart, 
   Scatter, 
   XAxis, 
   YAxis, 
   ZAxis,
   CartesianGrid, 
   Tooltip, 
   ResponsiveContainer,
   Legend,
   Cell
 } from "recharts";
 
 const generateData = (count: number, category: string) => {
   return Array.from({ length: count }, () => ({
     x: Math.random() * 100,
     y: Math.random() * 100,
     z: Math.random() * 400 + 100,
     category,
   }));
 };
 
 const seismicData = generateData(15, 'Seismic');
 const weatherData = generateData(20, 'Weather');
 const oceanicData = generateData(12, 'Oceanic');
 
 const COLORS = {
   Seismic: 'hsl(var(--primary))',
   Weather: '#9b59b6',
   Oceanic: '#22c55e',
 };
 
 export const ScatterPlot3D = () => {
   return (
     <motion.div
       initial={{ opacity: 0, y: 20 }}
       whileInView={{ opacity: 1, y: 0 }}
       viewport={{ once: true }}
     >
       <Card className="glass-panel p-6 glow-border-hover">
         <h3 className="text-xl font-bold mb-4 text-foreground flex items-center gap-2">
           📊 Anomaly Distribution Map
         </h3>
         <p className="text-sm text-muted-foreground mb-4">
           Bubble size represents severity level
         </p>
         <ResponsiveContainer width="100%" height={300}>
           <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
             <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
             <XAxis 
               type="number" 
               dataKey="x" 
               name="Longitude" 
               unit="°" 
               stroke="hsl(var(--muted-foreground))"
               tick={{ fontSize: 10 }}
             />
             <YAxis 
               type="number" 
               dataKey="y" 
               name="Latitude" 
               unit="°"
               stroke="hsl(var(--muted-foreground))"
               tick={{ fontSize: 10 }}
             />
             <ZAxis type="number" dataKey="z" range={[50, 400]} name="Severity" />
             <Tooltip 
               cursor={{ strokeDasharray: '3 3' }}
               contentStyle={{ 
                 backgroundColor: 'hsl(var(--card))', 
                 border: '1px solid hsl(var(--border))',
                 borderRadius: '8px',
                 color: 'hsl(var(--foreground))'
               }}
             />
             <Legend />
             <Scatter name="Seismic" data={seismicData} fill={COLORS.Seismic}>
               {seismicData.map((_, index) => (
                 <Cell key={`cell-${index}`} fill={COLORS.Seismic} fillOpacity={0.7} />
               ))}
             </Scatter>
             <Scatter name="Weather" data={weatherData} fill={COLORS.Weather}>
               {weatherData.map((_, index) => (
                 <Cell key={`cell-${index}`} fill={COLORS.Weather} fillOpacity={0.7} />
               ))}
             </Scatter>
             <Scatter name="Oceanic" data={oceanicData} fill={COLORS.Oceanic}>
               {oceanicData.map((_, index) => (
                 <Cell key={`cell-${index}`} fill={COLORS.Oceanic} fillOpacity={0.7} />
               ))}
             </Scatter>
           </ScatterChart>
         </ResponsiveContainer>
       </Card>
     </motion.div>
   );
 };
 
 export default ScatterPlot3D;