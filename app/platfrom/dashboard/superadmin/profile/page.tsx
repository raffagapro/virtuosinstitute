"use client";

import { SharedProfilePage } from "@/app/platfrom/dashboard/profile-page";

export default function SuperadminProfilePage() {
  return <SharedProfilePage expectedPath="/platfrom/dashboard/superadmin/profile" isParent={false} />;
}
