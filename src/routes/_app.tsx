import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "@/layout/AppShell";
import { authService } from "@/services/authService";

// Session lives in browser storage / httpOnly cookies, so the authenticated area renders client-side only.
export const Route = createFileRoute("/_app")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const session = authService.getSession();
    if (!session) {
      if (location.pathname && location.pathname !== "/dashboard") {
        throw redirect({
          to: "/login",
          search: { redirect: location.pathname },
        });
      } else {
        throw redirect({
          to: "/login",
        });
      }
    }
  },
  component: AppShell,
});
