"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, BellOff, Check } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

interface NotificationCampaign {
  id: string;
  title: string;
  body: string;
  subject: string;
  launched_at: string | null;
  scheduled_for: string | null;
  delivery_mode: string;
}

interface NotificationDelivery {
  id: string;
  in_app_status: "unread" | "read" | "hidden";
  email_status: string;
  delivered_at: string | null;
  read_at: string | null;
  notification_campaigns: NotificationCampaign | null;
}

interface Labels {
  title: string;
  subtitle: string;
  loading: string;
  error: string;
  empty: string;
  markRead: string;
  labelNew: string;
  labelRead: string;
}

interface ParentNotificationsPageProps {
  labels: Labels;
}

export function ParentNotificationsPage({ labels }: ParentNotificationsPageProps) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loadingInit, setLoadingInit] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  const [deliveries, setDeliveries] = useState<NotificationDelivery[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setInitError(labels.error);
        setLoadingInit(false);
        return;
      }
      setAccessToken(session.access_token);
      setLoadingInit(false);
    }
    init();
  }, [labels.error]);

  const fetchNotifications = useCallback(
    async (token: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/parent/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.ok) {
          setDeliveries(data.deliveries ?? []);
        } else {
          setError(labels.error);
        }
      } catch {
        setError(labels.error);
      } finally {
        setLoading(false);
      }
    },
    [labels.error]
  );

  useEffect(() => {
    if (accessToken) {
      fetchNotifications(accessToken);
    }
  }, [accessToken, fetchNotifications]);

  async function handleMarkRead(id: string) {
    if (!accessToken || markingId) return;
    setMarkingId(id);
    try {
      await fetch(`/api/parent/notifications/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setDeliveries((prev) =>
        prev.map((d) =>
          d.id === id ? { ...d, in_app_status: "read" as const, read_at: new Date().toISOString() } : d
        )
      );
    } finally {
      setMarkingId(null);
    }
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  if (loadingInit) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-[#2b5876]">{labels.loading}</p>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="rounded-2xl border border-[#fcd9df] bg-white p-6">
        <p className="text-sm text-[#fa4361]">{initError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e0f2fe]">
          <Bell className="h-5 w-5 text-[#003F60]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#003F60]">{labels.title}</h1>
          <p className="text-sm text-[#2b5876]">{labels.subtitle}</p>
        </div>
      </div>

      {/* Content */}
      <div className="rounded-2xl border border-[#d6e8f6] bg-white p-5 sm:p-6">
        {loading ? (
          <p className="py-4 text-center text-sm text-[#2b5876]">{labels.loading}</p>
        ) : error ? (
          <p className="text-sm text-[#fa4361]">{error}</p>
        ) : deliveries.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10">
            <BellOff className="h-8 w-8 text-[#93c5e0]" />
            <p className="text-sm text-[#2b5876]">{labels.empty}</p>
          </div>
        ) : (
          <ul className="divide-y divide-[#e8f3fb]">
            {deliveries.map((delivery) => {
              const campaign = delivery.notification_campaigns;
              if (!campaign) return null;
              const isUnread = delivery.in_app_status === "unread";
              const dateStr = delivery.delivered_at ?? delivery.notification_campaigns?.launched_at ?? null;

              return (
                <li
                  key={delivery.id}
                  className={`flex items-start gap-4 py-4 ${isUnread ? "bg-[#f0f8ff]" : ""} -mx-1 px-1 rounded-lg`}
                >
                  {/* Unread indicator */}
                  <div className="mt-1 flex-shrink-0">
                    {isUnread ? (
                      <span className="block h-2.5 w-2.5 rounded-full bg-[#0085CC]" />
                    ) : (
                      <span className="block h-2.5 w-2.5 rounded-full bg-[#d6e8f6]" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`text-sm ${
                          isUnread
                            ? "font-semibold text-[#003F60]"
                            : "font-medium text-[#2b5876]"
                        }`}
                      >
                        {campaign.title}
                      </p>
                      <span
                        className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          isUnread
                            ? "bg-[#0085CC] text-white"
                            : "bg-[#e8f3fb] text-[#2b5876]"
                        }`}
                      >
                        {isUnread ? labels.labelNew : labels.labelRead}
                      </span>
                    </div>
                    {campaign.body && campaign.body !== campaign.title && (
                      <p className="mt-1 text-xs text-[#2b5876] line-clamp-2">{campaign.body}</p>
                    )}
                    <div className="mt-1.5 flex items-center gap-3">
                      {dateStr && (
                        <span className="text-[11px] text-[#93c5e0]">{formatDate(dateStr)}</span>
                      )}
                      {isUnread && (
                        <button
                          onClick={() => handleMarkRead(delivery.id)}
                          disabled={markingId === delivery.id}
                          className="flex items-center gap-1 text-[11px] text-[#0085CC] hover:underline disabled:opacity-50"
                        >
                          <Check className="h-3 w-3" />
                          {labels.markRead}
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
