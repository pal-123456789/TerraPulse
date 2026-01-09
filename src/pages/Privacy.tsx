import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Shield } from "lucide-react";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-space-gradient">
      <Navigation />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 md:pt-32 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">Privacy Policy</h1>
              <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="glass-panel p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">1. Information We Collect</h2>
              <p className="text-muted-foreground leading-relaxed">
                TerraPulse collects environmental data from various sources including NASA satellites, weather APIs, 
                and user-submitted reports. We collect location data, environmental metrics, and user interaction data 
                to provide our AI-powered monitoring services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">2. How We Use Your Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your information is used to provide real-time environmental monitoring, predict natural anomalies, 
                and improve our AI algorithms. We analyze patterns to enhance prediction accuracy and provide 
                better alerts to our users.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">3. Data Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We implement industry-standard security measures to protect your data. All sensitive information 
                is encrypted in transit and at rest. We regularly audit our security practices to ensure your 
                data remains safe.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">4. Data Sharing</h2>
              <p className="text-muted-foreground leading-relaxed">
                We do not sell your personal information. Environmental data may be shared in aggregated, 
                anonymized form for research purposes to advance climate science and disaster prediction.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">5. Your Rights</h2>
              <p className="text-muted-foreground leading-relaxed">
                You have the right to access, modify, or delete your personal data. You can export your data 
                at any time through your account settings. To exercise these rights, contact us at 
                palghevariya.co23d2@scet.ac.in.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">6. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about this Privacy Policy, please contact:
                <br />
                <strong className="text-foreground">Pal Ghevariya</strong>
                <br />
                Email: palghevariya.co23d2@scet.ac.in
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Privacy;
