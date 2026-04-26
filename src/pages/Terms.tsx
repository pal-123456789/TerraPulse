import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { FileText } from "lucide-react";

const Terms = () => {
  return (
    <div className="min-h-screen bg-space-gradient">
      <Navigation />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 md:pt-32 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">Terms of Service</h1>
              <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="glass-panel p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using TerraPulse, you accept and agree to be bound by the terms and provision 
                of this agreement. If you do not agree to these terms, please do not use our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">2. Service Description</h2>
              <p className="text-muted-foreground leading-relaxed">
                TerraPulse provides AI-powered environmental monitoring services, including real-time anomaly 
                detection, predictive analytics, and data visualization. We strive for accuracy but cannot 
                guarantee 100% precision in predictions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">3. User Responsibilities</h2>
              <p className="text-muted-foreground leading-relaxed">
                Users are responsible for maintaining the confidentiality of their account credentials. 
                You agree to provide accurate information when submitting reports and to use the service 
                in compliance with all applicable laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">4. Data Accuracy</h2>
              <p className="text-muted-foreground leading-relaxed">
                While we use advanced AI and multiple data sources, environmental predictions are inherently 
                uncertain. Users should not rely solely on our predictions for critical decisions without 
                consulting official authorities.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">5. Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                All content, features, and functionality of TerraPulse are owned by us and are protected 
                by international copyright, trademark, and other intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">6. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                TerraPulse shall not be liable for any indirect, incidental, special, consequential, or 
                punitive damages resulting from your use or inability to use the service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">7. Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                For questions about these Terms of Service, please contact:
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

export default Terms;
