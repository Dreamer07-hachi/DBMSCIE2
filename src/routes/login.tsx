import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROLE_LABELS, type Role } from "@/config/permissions";
import { getErrorMessage } from "@/services/apiClient";
import { authService, DEMO_PASSWORD, DEMO_USERS } from "@/services/authService";
import { pageHead } from "@/utils/seo";

interface LoginSearch {
  redirect?: string | undefined;
}

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => {
    const r = search["redirect"];
    return {
      redirect: typeof r === "string" ? r : undefined,
    };
  },
  head: () =>
    pageHead(
      "Login - PICT College ERP",
      "Sign in to PICT College ERP with your institute email, student ID, or demo role."
    ),
  component: LoginPage,
});

const schema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, "Email or Student ID is required")
    .max(120, "Identifier must not exceed 120 characters"),
  password: z
    .string()
    .min(1, "Password is required")
    .max(100, "Password must not exceed 100 characters"),
  remember: z.boolean(),
});

type Values = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const redirectParam = search["redirect"];
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [forgot, setForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      identifier: "",
      password: "",
      remember: true,
    },
  });

  // Prevent already-authenticated users from staying on login page
  useEffect(() => {
    const session = authService.getSession();
    if (session) {
      const destination = redirectParam && redirectParam.startsWith("/")
        ? redirectParam
        : "/dashboard";
      navigate({ to: destination as "/dashboard", replace: true });
    }
  }, [navigate, redirectParam]);

  const onSubmit = async (v: Values) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const s = await authService.login(v.identifier, v.password, v.remember);
      toast.success(`Welcome back, ${s.user.name}`);
      const destination = redirectParam && redirectParam.startsWith("/")
        ? redirectParam
        : "/dashboard";
      navigate({ to: destination as "/dashboard" });
    } catch (e) {
      const msg = getErrorMessage(e);
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role: Role) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const s = await authService.loginAs(role);
      toast.success(`Signed in as ${ROLE_LABELS[role]}`, {
        description: s.user.name,
      });
      const destination = redirectParam && redirectParam.startsWith("/")
        ? redirectParam
        : "/dashboard";
      navigate({ to: destination as "/dashboard" });
    } catch (e) {
      const msg = getErrorMessage(e);
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (identifier: string, pass = DEMO_PASSWORD) => {
    form.setValue("identifier", identifier, { shouldValidate: true });
    form.setValue("password", pass, { shouldValidate: true });
    setErrorMessage(null);
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-muted/30 px-4 py-8 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* PICT Branding Header */}
        <div className="flex flex-col items-center text-center">
          <Link
            to="/"
            className="group flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md transition-transform duration-200 hover:scale-105"
            aria-label="PICT College ERP Home"
          >
            <GraduationCap className="h-8 w-8" />
          </Link>

          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground shadow-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-teal" />
            Autonomous Institute · SPPU Affiliated
          </div>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            PICT College ERP
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in with your institute email or Student ID
          </p>
        </div>

        {/* Main Login Card */}
        <div className="mt-6 rounded-xl border bg-card p-6 shadow-sm sm:p-8">
          {/* Inline Error Banner */}
          {errorMessage && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="space-y-0.5">
                <p className="font-medium">Authentication Failed</p>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* Email / Student ID field */}
            <div className="space-y-1.5">
              <Label htmlFor="login-identifier" className="text-xs font-semibold">
                Email or Student ID <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                </div>
                <Input
                  id="login-identifier"
                  type="text"
                  autoComplete="username"
                  placeholder="admin@pict.edu or STU2023001"
                  className="pl-9"
                  disabled={loading}
                  aria-invalid={!!form.formState.errors.identifier}
                  {...form.register("identifier")}
                />
              </div>
              {form.formState.errors.identifier && (
                <p className="text-xs text-destructive" role="alert">
                  {form.formState.errors.identifier.message}
                </p>
              )}
            </div>

            {/* Password field with show/hide toggle */}
            <div className="space-y-1.5">
              <Label htmlFor="login-password" className="text-xs font-semibold">
                Password <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                  <Lock className="h-4 w-4" />
                </div>
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="pl-9 pr-10"
                  disabled={loading}
                  aria-invalid={!!form.formState.errors.password}
                  {...form.register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={0}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-xs text-destructive" role="alert">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            {/* Remember Me and Forgot Password */}
            <div className="flex items-center justify-between pt-1">
              <label
                htmlFor="login-remember"
                className="flex cursor-pointer select-none items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <Checkbox
                  id="login-remember"
                  checked={form.watch("remember")}
                  onCheckedChange={(checked) => form.setValue("remember", !!checked)}
                  disabled={loading}
                />
                Remember me for 7 days
              </label>

              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs font-medium text-primary hover:underline"
                onClick={() => setForgot(true)}
              >
                Forgot password?
              </Button>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="mt-2 w-full gap-2 font-medium"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Signing in…</span>
                </>
              ) : (
                <>
                  <span>Sign in to ERP</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Safe demo note */}
          <div className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
            <KeyRound className="h-3.5 w-3.5" />
            <span>
              Sample password: <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">{DEMO_PASSWORD}</code>
            </span>
          </div>
        </div>

        {/* Quick Testing Role Switcher */}
        <div className="mt-6 rounded-xl border bg-card p-4 shadow-xs">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              <span>Quick Demo Accounts</span>
            </div>
            <span className="text-[11px] text-muted-foreground">One-click sign-in</span>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {/* Student Account */}
            <Button
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => handleQuickLogin("student")}
              className="h-auto flex-col items-start gap-1 p-2.5 text-left transition hover:border-primary/50"
            >
              <div className="flex w-full items-center justify-between">
                <span className="font-semibold text-xs text-foreground">Student</span>
                <span className="rounded bg-teal/15 px-1 py-0.2 text-[10px] font-medium text-teal">STU</span>
              </div>
              <span className="text-[11px] text-muted-foreground truncate w-full">Aarav Kulkarni</span>
            </Button>

            {/* Faculty Account */}
            <Button
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => handleQuickLogin("faculty")}
              className="h-auto flex-col items-start gap-1 p-2.5 text-left transition hover:border-primary/50"
            >
              <div className="flex w-full items-center justify-between">
                <span className="font-semibold text-xs text-foreground">Faculty</span>
                <span className="rounded bg-info/15 px-1 py-0.2 text-[10px] font-medium text-info">FAC</span>
              </div>
              <span className="text-[11px] text-muted-foreground truncate w-full">Prof. Deshpande</span>
            </Button>

            {/* Super Admin Account */}
            <Button
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => handleQuickLogin("super_admin")}
              className="h-auto flex-col items-start gap-1 p-2.5 text-left transition hover:border-primary/50"
            >
              <div className="flex w-full items-center justify-between">
                <span className="font-semibold text-xs text-foreground">Admin</span>
                <span className="rounded bg-amber/20 px-1 py-0.2 text-[10px] font-medium text-amber">ADM</span>
              </div>
              <span className="text-[11px] text-muted-foreground truncate w-full">Dr. Bhandari</span>
            </Button>
          </div>

          {/* Quick Credential Fillers for Testing Typed Login */}
          <div className="mt-3 border-t pt-2 flex flex-wrap items-center justify-between gap-1 text-[11px] text-muted-foreground">
            <span>Fill form with:</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => fillCredentials("STU2023001")}
                className="underline hover:text-foreground"
              >
                Student ID
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => fillCredentials("faculty@pict.edu")}
                className="underline hover:text-foreground"
              >
                Faculty Email
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => fillCredentials("admin@pict.edu")}
                className="underline hover:text-foreground"
              >
                Admin Email
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          © 2026 Pune Institute of Computer Technology · All rights reserved
        </p>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        open={forgot}
        onOpenChange={setForgot}
        title="Reset ERP Password"
        description="Enter your registered PICT email to receive password reset instructions."
      >
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!/^\S+@\S+\.\S+$/.test(resetEmail)) {
              toast.error("Please enter a valid email address");
              return;
            }
            setResetLoading(true);
            try {
              await authService.requestPasswordReset(resetEmail);
              toast.success("Password reset instructions dispatched", {
                description: `Sent to ${resetEmail}`,
              });
              setForgot(false);
              setResetEmail("");
            } catch (err) {
              toast.error(getErrorMessage(err));
            } finally {
              setResetLoading(false);
            }
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="reset-email" className="text-xs font-semibold">
              Institute Email <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                <Mail className="h-4 w-4" />
              </div>
              <Input
                id="reset-email"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="aarav.kulkarni@pict.edu"
                className="pl-9"
                disabled={resetLoading}
                required
              />
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setForgot(false)}
              disabled={resetLoading}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={resetLoading}>
              {resetLoading ? "Sending link…" : "Send Reset Link"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
