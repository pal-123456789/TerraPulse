import { Suspense, lazy } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Workflow, Radar } from "lucide-react";
import Navigation from "@/components/Navigation";
import PageLoader from "@/components/PageLoader";

const UnifiedTimeline = lazy(() => import("@/components/Ops/UnifiedTimeline"));
const RemediationRules = lazy(() => import("@/components/Ops/RemediationRules"));
const CommandCenter = lazy(() => import("@/components/Ops/CommandCenter"));

const OpsConsole = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground flex items-center gap-3">
            <Activity className="w-8 h-8 text-primary" />
            Incident Command Center
          </h1>
          <p className="text-muted-foreground mt-2">
            One pane of glass for Sentry runtime errors and Aikido security findings — with auto-remediation.
          </p>
        </motion.div>

        <Tabs defaultValue="timeline" className="w-full">
          <TabsList className="glass-panel mb-6">
            <TabsTrigger value="timeline" className="gap-2"><Activity className="w-4 h-4" />Timeline</TabsTrigger>
            <TabsTrigger value="rules" className="gap-2"><Workflow className="w-4 h-4" />Auto-Remediation</TabsTrigger>
            <TabsTrigger value="command" className="gap-2"><Radar className="w-4 h-4" />Command Center</TabsTrigger>
          </TabsList>

          <Suspense fallback={<PageLoader />}>
            <TabsContent value="timeline"><UnifiedTimeline /></TabsContent>
            <TabsContent value="rules"><RemediationRules /></TabsContent>
            <TabsContent value="command"><CommandCenter /></TabsContent>
          </Suspense>
        </Tabs>
      </main>
    </div>
  );
};

export default OpsConsole;
