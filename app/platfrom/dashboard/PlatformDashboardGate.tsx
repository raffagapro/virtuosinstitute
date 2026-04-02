"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

interface PlatformDashboardGateProps {
  checkingLabel: string;
  title: string;
  subtitle: string;
}

interface BootstrapResponse {
  ok: boolean;
  status?: "pending" | "approved" | "rejected" | "suspended";
}

export function PlatformDashboardGate({ checkingLabel, title, subtitle }: PlatformDashboardGateProps) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [isApproved, setIsApproved] = useState(false);
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

      setIsApproved(true);
      setIsChecking(false);
    };

    void verify();
  }, []);

  if (isChecking || !isApproved) {
    return <p className="text-lg text-[#2b5876]">{checkingLabel}</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="font-['Sora',Helvetica,Arial,sans-serif] text-4xl font-bold leading-tight">{title}</h1>
      <p className="text-lg text-[#2b5876]">{subtitle}</p>
    </div>
  );
}
