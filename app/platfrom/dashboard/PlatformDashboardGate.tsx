"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

interface PlatformDashboardGateProps {
  expectedPath?: string;
  children?: ReactNode;
}

interface BootstrapResponse {
  ok: boolean;
  status?: "pending" | "approved" | "rejected" | "suspended";
  dashboardPath?: string;
}

export function PlatformDashboardGate({ expectedPath, children }: PlatformDashboardGateProps) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [isResolved, setIsResolved] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const verify = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        window.location.assign("/platfrom");
        return;
      }

      const response = await fetch("/api/auth/platform-bootstrap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        window.location.assign("/platfrom");
        return;
      }

      const payload = (await response.json()) as BootstrapResponse;
      if (!payload.ok || payload.status !== "approved") {
        window.location.assign("/platfrom");
        return;
      }

      const dashboardPath = payload.dashboardPath ?? "/platfrom/dashboard/parent";
      if (!expectedPath) {
        window.location.assign(dashboardPath);
        return;
      }

      // Allow access to nested routes within the dashboard (e.g., /platfrom/dashboard/parent/profile)
      const isWithinDashboard = expectedPath === dashboardPath || expectedPath.startsWith(`${dashboardPath}/`);
      if (!isWithinDashboard) {
        window.location.assign(dashboardPath);
        return;
      }

      setIsResolved(true);
      setIsChecking(false);
    };

    void verify();
  }, []);

  if (isChecking || !isResolved) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#eef4fa] border-t-[#fa4361]" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
