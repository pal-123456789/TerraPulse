import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import SEO from "@/components/SEO";

type EmailOtpType =
  | "signup"
  | "invite"
  | "magiclink"
  | "recovery"
  | "email_change"
  | "email";

const AuthConfirm = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"working" | "ok" | "error">("working");
  const [message, setMessage] = useState("Verifying your link…");

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const tokenHash = params.get("token_hash") ?? params.get("token");
      const rawType = (params.get("type") ?? "signup").replace(
        /^email_change_(current|new)$/,
        "email_change",
      ) as EmailOtpType;
      const redirectTo = params.get("redirect_to");

      // Some links (implicit flow) already carry the session in the URL hash.
      if (!tokenHash && window.location.hash.includes("access_token")) {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setStatus("ok");
          setMessage("You're signed in. Redirecting…");
          setTimeout(() => navigate(rawType === "recovery" ? "/reset-password" : "/dashboard", { replace: true }), 1200);
          return;
        }
      }

      if (!tokenHash) {
        setStatus("error");
        setMessage("This confirmation link is invalid or incomplete.");
        return;
      }

      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: rawType,
      });

      if (cancelled) return;

      if (error) {
        setStatus("error");
        setMessage(
          error.message.toLowerCase().includes("expired")
            ? "This link has expired. Request a new one and try again."
            : error.message,
        );
        return;
      }

      setStatus("ok");
      setMessage("Email confirmed! Redirecting…");
      const target =
        rawType === "recovery"
          ? "/reset-password"
          : redirectTo && redirectTo.startsWith("/")
            ? redirectTo
            : "/dashboard";
      setTimeout(() => navigate(target, { replace: true }), 1200);
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [params, navigate]);

  return (
    <>
      <SEO title="Confirm your email | TerraGuardians" description="Confirming your TerraGuardians account." path="/auth/confirm" />
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card/60 backdrop-blur p-8 text-center">
          {status === "working" && <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />}
          {status === "ok" && <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />}
          {status === "error" && <AlertTriangle className="mx-auto h-10 w-10 text-destructive" />}
          <h1 className="mt-4 text-xl font-semibold text-foreground">
            {status === "error" ? "Verification failed" : "Email verification"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{message}</p>
          {status === "error" && (
            <button
              onClick={() => navigate("/", { replace: true })}
              className="mt-6 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
            >
              Back to home
            </button>
          )}
        </div>
      </main>
    </>
  );
};

export default AuthConfirm;
