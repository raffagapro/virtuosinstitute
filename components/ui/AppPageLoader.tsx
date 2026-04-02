"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";

export function AppPageLoader() {
  const [isPending] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <>
      {isPending && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm"
          role="status"
          aria-label="Loading page"
        >
          <div className="flex flex-col items-center gap-4">
            {/* Loading spinner */}
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#eef4fa] border-t-[#fa4361]" />
            <p className="text-sm font-medium text-[#003F60]">Loading...</p>
          </div>
        </div>
      )}
    </>
  );
}
