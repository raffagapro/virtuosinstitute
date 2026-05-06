"use client";

import { SharedProfilePage } from "@/app/platfrom/dashboard/profile-page";

export default function ParentProfilePage() {
  return <SharedProfilePage expectedPath="/platfrom/dashboard/parent/profile" isParent={true} />;
}
