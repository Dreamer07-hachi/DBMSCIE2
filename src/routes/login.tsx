import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  User,
  UserPlus,
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

/* ─────────────────────────────────────── Route ── */
interface LoginSearch {
  redirect?: string | undefined;
}

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => {
    const r = search["redirect"];
    return { redirect: typeof r === "string" ? r : undefined };
  },
  head: () =>
    pageHead(
      "Login – PICT College ERP",
      "Sign in to PICT College ERP as Student, Faculty, or Admin."
    ),
  component: LoginPage,
});

/* ─────────────────────────────────── Tab types ── */
type RoleTab = "student" | "faculty" | "admin";
type FormMode = "login" | "signup";

interface RoleTabConfig {
  key: RoleTab;
  label: string;
  icon: React.ReactNode;
  badge: string;
  badgeClass: string;
  placeholder: string;
  demoEmail: string;
  demoId?: string;
  canSignup: boolean;
  signupNote?: string;
  role: Role;
}

const ROLE_TABS: RoleTabConfig[] = [
  {
    key: "student",
    label: "Student",
    icon: <GraduationCap className="h-4 w-4" />,
    badge: "STU",
    badgeClass: "bg-teal/15 text-teal",
    placeholder: "student.id@pict.edu or STU2023001",
    demoEmail: "aarav.kulkarni@pict.edu",
    demoId: "STU2023001",
    canSignup: true,
    role: "student",
  },
  {
    key: "faculty",
    label: "Faculty",
    icon: <User className="h-4 w-4" />,
    badge: "FAC",
    badgeClass: "bg-blue-500/15 text-blue-600",
    placeholder: "faculty@pict.edu",
    demoEmail: "faculty@pict.edu",
    canSignup: true,
    signupNote: "Faculty accounts require approval by the administrator before activation.",
    role: "faculty",
  },
  {
    key: "admin",
    label: "Admin",
    icon: <ShieldCheck className="h-4 w-4" />,
    badge: "ADM",
    badgeClass: "bg-amber-500/20 text-amber-600",
    placeholder: "admin@pict.edu",
    demoEmail: "admin@pict.edu",
    canSignup: false,
    role: "super_admin",
  },
];

/* ──────────────────────────────── Zod schemas ── */
const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, "Email or Student ID is required")
    .max(120),
  password: z.string().min(1, "Password is required").max(100),
  remember: z.boolean(),
});

const signupSchema = z
  .object({
    name: z.string().trim().min(2, "Full name must be at least 2 characters").max(80),
    email: z.string().trim().email("Please enter a valid email address").max(150),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100)
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type LoginValues = z.infer<typeof loginSchema>;
type SignupValues = z.infer<typeof signupSchema>;

/* ───────────────────────────── Component ── */
export function LoginPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const redirectParam = search["redirect"];

  const [activeTab, setActiveTab] = useState<RoleTab>("student");
  const [formMode, setFormMode] = useState<FormMode>("login");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [forgot, setForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const currentTab = ROLE_TABS.find((t) => t.key === activeTab)!;

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "", remember: true },
  });

  const signupForm = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  // Prevent authenticated users from staying on login page
  useEffect(() => {
    const session = authService.getSession();
    if (session) {
      const dest =
        redirectParam && redirectParam.startsWith("/") ? redirectParam : "/dashboard";
      navigate({ to: dest as "/dashboard", replace: true });
    }
  }, [navigate, redirectParam]);

  // Reset form state when switching tabs or mode
  const switchTab = (tab: RoleTab) => {
    setActiveTab(tab);
    setErrorMessage(null);
    setSuccessMessage(null);
    loginForm.reset();
    signupForm.reset();
    setShowPassword(false);
    setShowConfirm(false);
  };

  const switchMode = (mode: FormMode) => {
    setFormMode(mode);
    setErrorMessage(null);
    setSuccessMessage(null);
    loginForm.reset();
    signupForm.reset();
    setShowPassword(false);
    setShowConfirm(false);
  };

  /* ─── LOGIN ─── */
  const onLogin = async (v: LoginValues) => {
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const s = await authService.login(v.identifier, v.password, v.remember);
      setSuccessMessage(`Login successful! Welcome back, ${s.user.name}.`);
      toast.success("Login successful! Welcome back.", { description: s.user.name });
      await new Promise((r) => setTimeout(r, 800));
      const dest =
        redirectParam && redirectParam.startsWith("/") ? redirectParam : "/dashboard";
      navigate({ to: dest as "/dashboard" });
    } catch (e) {
      const msg = getErrorMessage(e);
      // Normalise the error for a clean user-facing message
      const display = msg.includes("502") || msg.includes("Bad Gateway") || msg.includes("reach")
        ? "Could not reach the server. Please try again later or contact IT support."
        : msg.includes("401") || msg.includes("Invalid") || msg.includes("credentials")
          ? "Invalid email or password. Please try again."
          : msg;
      setErrorMessage(display);
      toast.error(display);
    } finally {
      setLoading(false);
    }
  };

  /* ─── SIGNUP ─── */
  const onSignup = async (v: SignupValues) => {
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await authService.register(v.name, v.email, v.password, currentTab.role);
      const msg =
        activeTab === "faculty"
          ? "Account created! Your request is pending administrator approval."
          : "Account created successfully! You can now log in.";
      setSuccessMessage(msg);
      toast.success(msg);
      // Switch back to login after short delay
      await new Promise((r) => setTimeout(r, 1200));
      signupForm.reset();
      setFormMode("login");
      loginForm.setValue("identifier", v.email);
    } catch (e) {
      const msg = getErrorMessage(e);
      const display =
        msg.includes("duplicate") || msg.includes("already") || msg.includes("exists")
          ? "An account with this email already exists. Please log in instead."
          : msg.includes("502") || msg.includes("reach")
            ? "Could not reach the server. Please try again later."
            : msg;
      setErrorMessage(display);
      toast.error(display);
    } finally {
      setLoading(false);
    }
  };

  /* ─── Quick login (one-click) ─── */
  const handleQuickLogin = async (role: Role) => {
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const s = await authService.loginAs(role);
      setSuccessMessage(`Login successful! Welcome back, ${s.user.name}.`);
      toast.success(`Signed in as ${ROLE_LABELS[role]}`, { description: s.user.name });
      await new Promise((r) => setTimeout(r, 600));
      const dest =
        redirectParam && redirectParam.startsWith("/") ? redirectParam : "/dashboard";
      navigate({ to: dest as "/dashboard" });
    } catch (e) {
      const msg = getErrorMessage(e);
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const fillLogin = (identifier: string, pass = DEMO_PASSWORD) => {
    loginForm.setValue("identifier", identifier, { shouldValidate: true });
    loginForm.setValue("password", pass, { shouldValidate: true });
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  /* ─── JSX ─── */
  return (
    <div className="flex min-h-screen flex-col justify-center bg-muted/30 px-4 py-8 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">

        {/* Branding */}
        <div className="flex flex-col items-center text-center">
          <div className="group flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
            <GraduationCap className="h-8 w-8" />
          </div>
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

        {/* Main Card */}
        <div className="mt-6 rounded-xl border bg-card shadow-sm">

          {/* Role Tabs */}
          <div className="flex border-b">
            {ROLE_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => switchTab(tab.key)}
                disabled={loading}
                className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-3 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  activeTab === tab.key
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                <span className={`hidden rounded px-1 py-0.5 text-[10px] font-medium sm:block ${tab.badgeClass}`}>
                  {tab.badge}
                </span>
              </button>
            ))}
          </div>

          {/* Login / Sign Up sub-tabs */}
          {currentTab.canSignup && (
            <div className="flex border-b bg-muted/30">
              {(["login", "signup"] as FormMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => switchMode(mode)}
                  disabled={loading}
                  className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    formMode === mode
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {mode === "login" ? (
                    <><KeyRound className="h-3.5 w-3.5" /> Sign In</>
                  ) : (
                    <><UserPlus className="h-3.5 w-3.5" /> Create Account</>
                  )}
                </button>
              ))}
            </div>
          )}

          <div className="p-6 sm:p-8">

            {/* Success Banner */}
            {successMessage && (
              <div
                role="status"
                className="mb-5 flex items-start gap-3 rounded-lg border border-green-500/20 bg-green-500/10 p-3.5 text-xs text-green-700 dark:text-green-400"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="font-medium">{successMessage}</p>
              </div>
            )}

            {/* Error Banner */}
            {errorMessage && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="space-y-0.5">
                  <p className="font-medium">
                    {formMode === "login" ? "Authentication Failed" : "Registration Failed"}
                  </p>
                  <p>{errorMessage}</p>
                </div>
              </div>
            )}

            {/* ═══ LOGIN FORM ═══ */}
            {formMode === "login" && (
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4" noValidate>

                {/* Identifier */}
                <div className="space-y-1.5">
                  <Label htmlFor="login-identifier" className="text-xs font-semibold">
                    {activeTab === "student" ? "Email or Student ID" : "Institute Email"}
                    <span className="text-destructive"> *</span>
                  </Label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                    </div>
                    <Input
                      id="login-identifier"
                      type="text"
                      autoComplete="username"
                      placeholder={currentTab.placeholder}
                      className="pl-9"
                      disabled={loading}
                      aria-invalid={!!loginForm.formState.errors.identifier}
                      {...loginForm.register("identifier")}
                    />
                  </div>
                  {loginForm.formState.errors.identifier && (
                    <p className="text-xs text-destructive" role="alert">
                      {loginForm.formState.errors.identifier.message}
                    </p>
                  )}
                </div>

                {/* Password */}
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
                      aria-invalid={!!loginForm.formState.errors.password}
                      {...loginForm.register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-xs text-destructive" role="alert">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                {/* Remember + Forgot */}
                <div className="flex items-center justify-between pt-1">
                  <label
                    htmlFor="login-remember"
                    className="flex cursor-pointer select-none items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Checkbox
                      id="login-remember"
                      checked={loginForm.watch("remember")}
                      onCheckedChange={(c) => loginForm.setValue("remember", !!c)}
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

                {/* Submit */}
                <Button type="submit" className="mt-2 w-full gap-2 font-medium" disabled={loading}>
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /><span>Signing in…</span></>
                  ) : (
                    <><span>Sign in to ERP</span><ArrowRight className="h-4 w-4" /></>
                  )}
                </Button>

                {/* Demo hint */}
                <div className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>
                    Sample password:{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                      {DEMO_PASSWORD}
                    </code>
                  </span>
                </div>

                {/* Quick fill */}
                <div className="flex flex-wrap items-center justify-center gap-2 border-t pt-3 text-[11px] text-muted-foreground">
                  <span>Quick fill:</span>
                  {currentTab.demoId && (
                    <button
                      type="button"
                      onClick={() => fillLogin(currentTab.demoId!)}
                      className="underline hover:text-foreground"
                    >
                      Student ID
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => fillLogin(currentTab.demoEmail)}
                    className="underline hover:text-foreground"
                  >
                    {activeTab === "admin" ? "Admin Email" : activeTab === "faculty" ? "Faculty Email" : "Student Email"}
                  </button>
                </div>
              </form>
            )}

            {/* ═══ SIGNUP FORM ═══ */}
            {formMode === "signup" && currentTab.canSignup && (
              <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4" noValidate>

                {currentTab.signupNote && (
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
                    <p className="font-medium">Note</p>
                    <p className="mt-0.5">{currentTab.signupNote}</p>
                  </div>
                )}

                {/* Full Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="signup-name" className="text-xs font-semibold">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                      <User className="h-4 w-4" />
                    </div>
                    <Input
                      id="signup-name"
                      type="text"
                      autoComplete="name"
                      placeholder="Your full name"
                      className="pl-9"
                      disabled={loading}
                      aria-invalid={!!signupForm.formState.errors.name}
                      {...signupForm.register("name")}
                    />
                  </div>
                  {signupForm.formState.errors.name && (
                    <p className="text-xs text-destructive" role="alert">
                      {signupForm.formState.errors.name.message}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="signup-email" className="text-xs font-semibold">
                    Institute Email <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                    </div>
                    <Input
                      id="signup-email"
                      type="email"
                      autoComplete="email"
                      placeholder={activeTab === "student" ? "student@pict.edu" : "faculty@pict.edu"}
                      className="pl-9"
                      disabled={loading}
                      aria-invalid={!!signupForm.formState.errors.email}
                      {...signupForm.register("email")}
                    />
                  </div>
                  {signupForm.formState.errors.email && (
                    <p className="text-xs text-destructive" role="alert">
                      {signupForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="signup-password" className="text-xs font-semibold">
                    Password <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                      <Lock className="h-4 w-4" />
                    </div>
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Min. 8 chars, 1 uppercase, 1 number"
                      className="pl-9 pr-10"
                      disabled={loading}
                      aria-invalid={!!signupForm.formState.errors.password}
                      {...signupForm.register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {signupForm.formState.errors.password && (
                    <p className="text-xs text-destructive" role="alert">
                      {signupForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="signup-confirm" className="text-xs font-semibold">
                    Confirm Password <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                      <Lock className="h-4 w-4" />
                    </div>
                    <Input
                      id="signup-confirm"
                      type={showConfirm ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Re-enter your password"
                      className="pl-9 pr-10"
                      disabled={loading}
                      aria-invalid={!!signupForm.formState.errors.confirmPassword}
                      {...signupForm.register("confirmPassword")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
                      aria-label={showConfirm ? "Hide password" : "Show password"}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {signupForm.formState.errors.confirmPassword && (
                    <p className="text-xs text-destructive" role="alert">
                      {signupForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                {/* Submit */}
                <Button type="submit" className="mt-2 w-full gap-2 font-medium" disabled={loading}>
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /><span>Creating account…</span></>
                  ) : (
                    <><UserPlus className="h-4 w-4" /><span>Create Account</span></>
                  )}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("login")}
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              </form>
            )}

            {/* Admin — no public signup */}
            {activeTab === "admin" && formMode === "signup" && (
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-center text-sm text-amber-700 dark:text-amber-400">
                <ShieldCheck className="mx-auto mb-2 h-6 w-6" />
                <p className="font-semibold">Admin accounts are restricted</p>
                <p className="mt-1 text-xs">
                  Administrator accounts cannot be created through public registration. Contact the
                  IT department to request access.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Demo Accounts */}
        <div className="mt-6 rounded-xl border bg-card p-4 shadow-xs">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              <span>Quick Demo Accounts</span>
            </div>
            <span className="text-[11px] text-muted-foreground">One-click sign-in</span>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {[
              { role: "student" as Role, label: "Student", name: "Aarav Kulkarni", badge: "STU", cls: "text-teal bg-teal/15" },
              { role: "faculty" as Role, label: "Faculty", name: "Prof. Deshpande", badge: "FAC", cls: "text-blue-600 bg-blue-500/15" },
              { role: "super_admin" as Role, label: "Admin", name: "Dr. Bhandari", badge: "ADM", cls: "text-amber-600 bg-amber-500/20" },
            ].map((item) => (
              <Button
                key={item.role}
                variant="outline"
                size="sm"
                disabled={loading}
                onClick={() => handleQuickLogin(item.role)}
                className="h-auto flex-col items-start gap-1 p-2.5 text-left transition hover:border-primary/50"
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">{item.label}</span>
                  <span className={`rounded px-1 py-0.5 text-[10px] font-medium ${item.cls}`}>
                    {item.badge}
                  </span>
                </div>
                <span className="w-full truncate text-[11px] text-muted-foreground">{item.name}</span>
              </Button>
            ))}
          </div>

          <div className="mt-3 border-t pt-2 flex flex-wrap items-center justify-between gap-1 text-[11px] text-muted-foreground">
            <span>Fill login form:</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => { switchTab("student"); fillLogin("STU2023001"); }}
                className="underline hover:text-foreground"
              >
                Student ID
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => { switchTab("faculty"); fillLogin("faculty@pict.edu"); }}
                className="underline hover:text-foreground"
              >
                Faculty Email
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => { switchTab("admin"); fillLogin("admin@pict.edu"); }}
                className="underline hover:text-foreground"
              >
                Admin Email
              </button>
            </div>
          </div>
        </div>

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
