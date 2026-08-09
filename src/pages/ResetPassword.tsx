import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Lock, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [recoverySession, setRecoverySession] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    // Supabase puts a recovery token in the URL hash and emits a
    // PASSWORD_RECOVERY event when the session is ready.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setRecoverySession(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setRecoverySession(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length < 6) {
      toast.error("Enter the 6-digit code from your email");
      return;
    }
    setVerifying(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: code.trim(),
        type: "recovery",
      });
      if (error) throw error;
      setRecoverySession(true);
      toast.success("Code verified. Choose a new password.");
    } catch (err: any) {
      toast.error(err?.message || "Invalid or expired code");
    } finally {
      setVerifying(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated. You're all set.");
      await supabase.auth.signOut();
      navigate("/");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-space-gradient flex items-center justify-center p-4">
      <Card className="glass-ultra border-primary/30 w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 w-14 h-14 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
            <ShieldCheck className="w-7 h-7 text-primary" />
          </div>
          <CardTitle className="text-2xl text-foreground">Reset your password</CardTitle>
          <CardDescription>
            Choose a strong new password for your TerraGuardians account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!recoverySession ? (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Enter your email and the 6-digit code we sent you.
              </p>
              <div className="space-y-2">
                <Label htmlFor="rp-email">Email</Label>
                <Input
                  id="rp-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rp-code">Verification code</Label>
                <Input
                  id="rp-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="text-center text-2xl tracking-[0.5em] font-mono"
                />
              </div>
              <Button type="submit" className="w-full gap-2" disabled={verifying}>
                {verifying && <Loader2 className="w-4 h-4 animate-spin" />}
                Verify code
              </Button>
            </form>
          ) : (

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pw">New password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="pw"
                    type="password"
                    minLength={8}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pw2">Confirm new password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="pw2"
                    type="password"
                    minLength={8}
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="pl-10"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Update password
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
