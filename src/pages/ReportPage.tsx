import Navigation from "@/components/Navigation";
import ReportSubmissionForm from "@/components/Reports/ReportSubmissionForm";
import { Card } from "@/components/ui/card";
import { FileText, TrendingUp, Users, CheckCircle } from "lucide-react";

const ReportPage = () => {
  return (
    <div className="min-h-screen bg-space-gradient">
      <Navigation />

      <main className="container mx-auto px-6 pt-24 pb-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 text-foreground">
              Community <span className="text-primary">Reports</span>
            </h1>
            <p className="text-muted-foreground">
              Share your environmental observations and help us monitor the planet
            </p>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="glass-panel p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">Total Reports</span>
              </div>
              <p className="text-2xl font-bold text-foreground">12,453</p>
            </Card>

            <Card className="glass-panel p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <span className="text-sm text-muted-foreground">Verified</span>
              </div>
              <p className="text-2xl font-bold text-foreground">8,721</p>
            </Card>

            <Card className="glass-panel p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                </div>
                <span className="text-sm text-muted-foreground">This Week</span>
              </div>
              <p className="text-2xl font-bold text-foreground">342</p>
            </Card>

            <Card className="glass-panel p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-yellow-400" />
                </div>
                <span className="text-sm text-muted-foreground">Contributors</span>
              </div>
              <p className="text-2xl font-bold text-foreground">3,892</p>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Submission Form */}
            <ReportSubmissionForm />

            {/* Guidelines */}
            <Card className="glass-panel p-6">
              <h3 className="text-xl font-bold mb-4 text-foreground">Reporting Guidelines</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-primary font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Be Specific</h4>
                    <p className="text-sm text-muted-foreground">
                      Provide detailed observations including date, time, and exact location.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-primary font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Include Evidence</h4>
                    <p className="text-sm text-muted-foreground">
                      Photos or videos greatly improve report credibility and verification.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-primary font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Stay Objective</h4>
                    <p className="text-sm text-muted-foreground">
                      Report what you observed without speculation or assumptions.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-primary font-bold">4</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Safety First</h4>
                    <p className="text-sm text-muted-foreground">
                      Never put yourself in danger to gather environmental data.
                    </p>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                  <p className="text-sm text-foreground">
                    <strong>Note:</strong> All reports are reviewed by our team and cross-referenced 
                    with scientific data sources for verification.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReportPage;