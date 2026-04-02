"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

interface UserDirectoryEntry {
  id: string;
  fullName: string | null;
  email: string | null;
  platformRole: string | null;
  preferredLocale: string;
  createdAt: string;
  membershipRoles: string[];
}

interface SuperadminUsersDirectoryProps {
  title: string;
  subtitle: string;
  emptyLabel: string;
  loadingLabel: string;
  errorLabel: string;
  fullNameColumnLabel: string;
  emailColumnLabel: string;
  platformRoleColumnLabel: string;
  membershipRolesColumnLabel: string;
}

export function SuperadminUsersDirectory({
  title,
  subtitle,
  emptyLabel,
  loadingLabel,
  errorLabel,
  fullNameColumnLabel,
  emailColumnLabel,
  platformRoleColumnLabel,
  membershipRolesColumnLabel,
}: SuperadminUsersDirectoryProps) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [users, setUsers] = useState<UserDirectoryEntry[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      setHasError(false);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setHasError(true);
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/admin/users-directory", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        setHasError(true);
        setIsLoading(false);
        return;
      }

      const payload = (await response.json()) as { ok: boolean; users?: UserDirectoryEntry[] };
      if (!payload.ok || !payload.users) {
        setHasError(true);
        setIsLoading(false);
        return;
      }

      setUsers(payload.users);
      setIsLoading(false);
    };

    void fetchUsers();
  }, [supabase]);

  return (
    <div className="space-y-4 rounded-2xl border border-[#d6e8f6] bg-white p-5 sm:p-6">
      <div>
        <h1 className="font-['Sora',Helvetica,Arial,sans-serif] text-2xl font-bold text-[#003F60] sm:text-3xl">{title}</h1>
        <p className="mt-2 text-sm text-[#2b5876] sm:text-base">{subtitle}</p>
      </div>

      {isLoading ? <p className="text-sm text-[#2b5876]">{loadingLabel}</p> : null}
      {hasError ? <p className="text-sm text-[#b51d3a]">{errorLabel}</p> : null}
      {!isLoading && !hasError && users.length === 0 ? <p className="text-sm text-[#2b5876]">{emptyLabel}</p> : null}

      {!isLoading && !hasError && users.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-[#e4eef7]">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-[#f5fbff]">
                <th className="px-4 py-3 text-left font-['Sora',Helvetica,Arial,sans-serif] text-xs font-bold uppercase tracking-[0.8px] text-[#2b5876]">
                  {fullNameColumnLabel}
                </th>
                <th className="px-4 py-3 text-left font-['Sora',Helvetica,Arial,sans-serif] text-xs font-bold uppercase tracking-[0.8px] text-[#2b5876]">
                  {emailColumnLabel}
                </th>
                <th className="px-4 py-3 text-left font-['Sora',Helvetica,Arial,sans-serif] text-xs font-bold uppercase tracking-[0.8px] text-[#2b5876]">
                  {platformRoleColumnLabel}
                </th>
                <th className="px-4 py-3 text-left font-['Sora',Helvetica,Arial,sans-serif] text-xs font-bold uppercase tracking-[0.8px] text-[#2b5876]">
                  {membershipRolesColumnLabel}
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-[#eef4fa]">
                  <td className="px-4 py-3 text-sm text-[#003F60]">{user.fullName || "-"}</td>
                  <td className="px-4 py-3 text-sm text-[#2b5876]">{user.email || "-"}</td>
                  <td className="px-4 py-3 text-sm text-[#003F60]">{user.platformRole || "-"}</td>
                  <td className="px-4 py-3 text-sm text-[#2b5876]">
                    {user.membershipRoles.length > 0 ? user.membershipRoles.join(", ") : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
