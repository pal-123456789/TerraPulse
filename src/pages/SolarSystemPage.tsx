import { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { ArrowLeft, Orbit, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { NeonText } from "@/components/ui/NeonText";

const SolarSystem = lazy(() => import("@/components/3D/SolarSystem"));

const SolarSystemPage = () => {
  return (
    <div className="min-h-screen bg-space-gradient relative overflow-x-hidden">
      <div className="fixed inset-0 bg-cyber-grid pointer-events-none opacity-10" />
      <SEO
        title={"Interactive 3D Solar System — Terra Guardians"}
        description={"Explore a realistic interactive 3D solar system with textured planets and orbital controls. Built by Terra Guardians, founded by Pal Ghevariya."}
        path={"/solar-system"}
        image={"/og-solar-system.jpg"}
        keywords={"3D solar system, interactive planetarium, planets, Pal Ghevariya, Terra Guardians, TerraPulse"}
      />

      <Navigation />

      <main className="relative z-10 pt-24 md:pt-28 pb-12">
        <section className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mx-auto max-w-5xl text-center mb-8 md:mb-10"
          >
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-5">
              <ArrowLeft className="w-4 h-4" />
              Back to Earth monitor
            </Link>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-5">
              <Orbit className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Interactive Planetarium</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-foreground mb-5">
              Realistic <NeonText variant="cyan">Solar System</NeonText>
            </h1>
            <p className="text-base md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Explore a large 3D orbital model with textured globe-like planets, atmospheric layers, Saturn rings, and real-time drag/zoom controls.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="relative mx-auto max-w-7xl"
          >
            <div className="absolute -inset-px rounded-2xl bg-glow-gradient opacity-30 blur-xl" aria-hidden="true" />
            <Suspense fallback={<div className="h-[88vh] rounded-2xl glass-ultra animate-pulse" />}>
              <SolarSystem height="min(1100px, 90vh)" className="rounded-2xl" />
            </Suspense>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto mt-8 grid max-w-5xl gap-4 md:grid-cols-3"
          >
            {[
              "Procedural surfaces make every planet feel like a model globe.",
              "OrbitControls let users rotate, inspect, and zoom the whole system.",
              "Mobile-aware rendering keeps the experience smooth on smaller devices.",
            ].map((item) => (
              <div key={item} className="glass-panel rounded-lg border border-border/50 p-4 flex gap-3 items-start">
                <Sparkles className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">{item}</p>
              </div>
            ))}
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default SolarSystemPage;