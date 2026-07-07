import { lazy, Suspense, useMemo, useState, type ComponentType } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Lock, User, Loader2, ShieldCheck, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import loginAnimation from "@/assets/lottie/login.json";

// Lazy-load lottie-react so a bundler/interop quirk (default vs namespace
// export) can never crash the modal with "Element type is invalid". The
// resolver normalizes both shapes and falls back to a static decoration.
const Lottie = lazy(async () => {
  try {
    const mod: any = await import("lottie-react");
    const Cmp: ComponentType<any> | undefined =
      (typeof mod?.default === "function" && mod.default) ||
      (typeof mod?.default?.default === "function" && mod.default.default) ||
      (typeof mod === "function" ? mod : undefined);
    if (!Cmp) throw new Error("lottie-react: no valid component export");
    return { default: Cmp };
  } catch {
    const Fallback: ComponentType<any> = () => (
      <div
        aria-hidden="true"
        className="w-full h-full rounded-full bg-gradient-to-br from-primary/40 via-accent/30 to-primary/10 blur-md"
      />
    );
    return { default: Fallback };
  }
});


interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AuthModal = ({ open, onOpenChange }: AuthModalProps) => {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [signupStep, setSignupStep] = useState<"details" | "otp">("details");
  const [otp, setOtp] = useState("");

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Enter your email above first");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Password reset link sent. Check your email.");
      setShowForgot(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      // Use current origin so redirect matches Supabase's allowed list on every
      // environment (preview, sandbox, custom domain). Hard-coding a domain
      // causes 403 errors on any other host.
      const redirectUrl = `${window.location.origin}/`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      toast.error(error.message || "Failed to sign in with Google");
      setGoogleLoading(false);
    }
  };

  const handleSignUp = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    if (password.trim().length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);

    try {
      // Create the account WITH a password set atomically. This prevents
      // accounts being created via OTP-only with no password, which later
      // causes "Invalid login credentials" when the user tries to sign in.
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            username: username.trim(),
            full_name: fullName.trim(),
          },
        },
      });

      if (error) {
        // If user already exists, guide them to sign in instead
        if (error.message?.toLowerCase().includes("already")) {
          toast.error("This email is already registered. Please sign in instead.");
          return;
        }
        throw error;
      }

      // If a session was returned, email confirmations are off — user is signed in.
      if (data.session) {
        toast.success("Account created. Welcome to TerraPulse!");
        onOpenChange(false);
        return;
      }

      // Otherwise, send an OTP they can use to verify and sign in immediately.
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: { shouldCreateUser: false },
      });
      if (otpError) {
        // Account was created but OTP couldn't be sent — they can still
        // confirm via the link in the signup email.
        toast.success("Account created. Check your email to confirm, then sign in.");
        onOpenChange(false);
        return;
      }

      setSignupStep("otp");
      toast.success("Verification code sent. Check your email.");
    } catch (error: any) {
      toast.error(error.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim().length < 6) {
      toast.error("Enter the 6-digit code from your email");
      return;
    }
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token: otp.trim(),
        type: "email",
      });

      if (error) throw error;

      if (data.user) {
        if (password.trim().length >= 6) {
          const { error: passwordError } = await supabase.auth.updateUser({ password });
          if (passwordError) throw passwordError;
        }

        await supabase
          .from("profiles")
          .upsert({
            id: data.user.id,
            username: username.trim(),
            full_name: fullName.trim(),
            updated_at: new Date().toISOString(),
          });
      }

      toast.success("Account verified. Welcome to TerraPulse!");
      onOpenChange(false);
      setSignupStep("details");
      setOtp("");
    } catch (error: any) {
      toast.error(error.message || "Invalid or expired verification code");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSignUpFallback = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            username: username.trim(),
            full_name: fullName.trim(),
          },
        },
      });

      if (error) throw error;

      toast.success("Account created. Check your email to confirm, then sign in.");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        const msg = error.message?.toLowerCase() || "";
        if (msg.includes("email not confirmed")) {
          toast.error("Please confirm your email first. Check your inbox for the verification link.");
        } else if (msg.includes("invalid")) {
          toast.error("Incorrect email or password. If you just signed up, confirm your email first or use 'Forgot password?'.");
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success("Welcome back!");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
          setSignupStep("details");
          setOtp("");
          setShowForgot(false);
        }
      }}
    >
      <DialogContent className="glass-ultra border-primary/20 max-w-3xl overflow-hidden p-0">
        <div className="grid md:grid-cols-[260px,1fr]">
          {/* Left: animation panel */}
          <div className="relative hidden md:flex flex-col items-center justify-center bg-gradient-to-br from-primary/15 via-accent/10 to-transparent p-6 border-r border-border/40">
            <div className="absolute inset-8 rounded-full bg-primary/20 blur-3xl" aria-hidden="true" />
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45 }}
              className="relative w-full max-w-[220px] aspect-square"
              aria-hidden="true"
            >
              <Suspense fallback={null}>
                <Lottie animationData={loginAnimation} loop autoplay rendererSettings={{ preserveAspectRatio: "xMidYMid meet" }} />
              </Suspense>
            </motion.div>
            <p className="relative text-center text-xs text-muted-foreground mt-4 leading-relaxed">
              Secure access to the global environmental network.
            </p>
          </div>

          {/* Right: form panel */}
          <div className="p-6 max-h-[90vh] overflow-y-auto">
            {/* Mobile-only compact animation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35 }}
              className="md:hidden relative mx-auto h-24 w-28 mb-2"
              aria-hidden="true"
            >
              <Suspense fallback={null}>
                <Lottie animationData={loginAnimation} loop autoplay rendererSettings={{ preserveAspectRatio: "xMidYMid meet" }} />
              </Suspense>
            </motion.div>

            <DialogHeader>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <DialogTitle className="text-2xl font-bold text-foreground text-left">
                  Welcome to <span className="text-primary text-glow">TerraPulse</span>
                </DialogTitle>
                <DialogDescription className="text-muted-foreground text-left">
                  Join our global environmental monitoring community
                </DialogDescription>
              </motion.div>
            </DialogHeader>

        {/* Google Sign In Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2 h-12 border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </Button>
        </motion.div>

        <div className="relative my-4">
          <Separator className="bg-border/50" />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-4 text-xs text-muted-foreground">
            or continue with email
          </span>
        </div>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted/50">
            <TabsTrigger value="signin" className="data-[state=active]:bg-primary/20">Sign In</TabsTrigger>
            <TabsTrigger value="signup" className="data-[state=active]:bg-primary/20">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <motion.form 
              onSubmit={handleSignIn} 
              className="space-y-4"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 bg-background/50 border-border/50 focus:border-primary/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 bg-background/50 border-border/50 focus:border-primary/50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-xs text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </motion.form>
          </TabsContent>

          <TabsContent value="signup">
            {signupStep === "details" ? (
              <motion.form 
                onSubmit={handleSignUp} 
                className="space-y-4"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="space-y-2">
                  <Label htmlFor="signup-username">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signup-username"
                      type="text"
                      placeholder="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="pl-10 bg-background/50 border-border/50 focus:border-primary/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-fullname">Full Name</Label>
                  <Input
                    id="signup-fullname"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="bg-background/50 border-border/50 focus:border-primary/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10 bg-background/50 border-border/50 focus:border-primary/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Keep this for password login"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="pl-10 bg-background/50 border-border/50 focus:border-primary/50"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full gap-2" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  {loading ? "Sending code..." : "Send email OTP"}
                </Button>
              </motion.form>
            ) : (
              <motion.form
                onSubmit={handleVerifyOtp}
                className="space-y-4"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <p className="text-sm font-medium text-foreground">Verify {normalizedEmail}</p>
                  <p className="text-xs text-muted-foreground mt-1">Enter the 6-digit code to create your account and sign in instantly.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-otp">Email OTP</Label>
                  <Input
                    id="signup-otp"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    required
                    className="bg-background/50 border-border/50 focus:border-primary/50 text-center text-2xl tracking-[0.35em]"
                  />
                </div>
                <Button type="submit" className="w-full gap-2" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  {loading ? "Verifying..." : "Verify & Sign In"}
                </Button>
                <div className="flex items-center justify-between gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setSignupStep("details")} className="gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Edit details
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={handleSignUp} disabled={loading}>
                    Resend code
                  </Button>
                </div>
                <button type="button" onClick={handlePasswordSignUpFallback} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                  Need password confirmation instead? Send confirmation link
                </button>
              </motion.form>
            )}
          </TabsContent>
        </Tabs>

        {/* Forgot password inline panel */}
        {showForgot && (
          <motion.form
            onSubmit={handleForgotPassword}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 rounded-lg border border-primary/20 bg-primary/5 space-y-3"
          >
            <p className="text-sm text-foreground font-medium">Reset your password</p>
            <p className="text-xs text-muted-foreground">
              We'll send a secure reset link to <span className="text-primary">{email || "your email"}</span>.
            </p>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={loading} className="gap-2">
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Send reset link
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShowForgot(false)}
              >
                Cancel
              </Button>
            </div>
          </motion.form>
        )}

        <p className="text-xs text-center text-muted-foreground mt-4">
          By continuing, you agree to our{" "}
          <a href="/terms" className="text-primary hover:underline">Terms of Service</a>
          {" "}and{" "}
          <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
        </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
