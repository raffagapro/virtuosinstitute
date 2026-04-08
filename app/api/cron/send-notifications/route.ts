import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { sendInviteEmail } from "@/lib/invite-mailer";

/**
 * GET /api/cron/send-notifications
 * Processes scheduled notification campaigns whose scheduled_for <= now().
 * Protected by Authorization: Bearer {CRON_SECRET}.
 * Configure in vercel.json as a daily cron job.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  let adminSupabase: ReturnType<typeof getSupabaseAdminClient>;
  try {
    adminSupabase = getSupabaseAdminClient();
  } catch {
    return NextResponse.json({ ok: false, reason: "service-role-missing" }, { status: 503 });
  }

  // Find all scheduled campaigns that are due.
  const now = new Date().toISOString();
  const { data: dueCampaigns, error: fetchErr } = await adminSupabase
    .from("notification_campaigns")
    .select("id, title, subject, body")
    .eq("delivery_mode", "scheduled")
    .eq("status", "scheduled")
    .lte("scheduled_for", now);

  if (fetchErr) {
    return NextResponse.json({ ok: false, reason: "fetch-failed" }, { status: 500 });
  }

  const campaigns = (
    dueCampaigns as Array<{ id: string; title: string; subject: string; body: string }> | null
  ) ?? [];

  let processed = 0;

  for (const campaign of campaigns) {
    // Mark as sending.
    await adminSupabase
      .from("notification_campaigns")
      .update({ status: "sending", launched_at: new Date().toISOString() } as unknown as never)
      .eq("id", campaign.id);

    // Fetch pending deliveries for this campaign.
    const { data: deliveries } = await adminSupabase
      .from("notification_deliveries")
      .select("id, profile_id")
      .eq("campaign_id", campaign.id)
      .eq("email_status", "pending");

    const pendingDeliveries = (
      deliveries as Array<{ id: string; profile_id: string }> | null
    ) ?? [];

    if (pendingDeliveries.length > 0) {
      const profileIds = pendingDeliveries.map((d) => d.profile_id);

      // Fetch profile emails.
      const { data: profiles } = await adminSupabase
        .from("profiles")
        .select("id, email")
        .in("id", profileIds);

      const emailMap = new Map(
        ((profiles as Array<{ id: string; email: string | null }> | null) ?? []).map((p) => [
          p.id,
          p.email,
        ])
      );

      const emailHtml = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#003F60"><h2 style="margin-bottom:8px">${campaign.subject}</h2><p style="margin-top:12px">${campaign.body}</p></div>`;
      const emailText = `${campaign.subject}\n\n${campaign.body}`;

      for (const delivery of pendingDeliveries) {
        const email = emailMap.get(delivery.profile_id) ?? null;

        if (email) {
          try {
            await sendInviteEmail({
              toEmail: email,
              subject: campaign.subject,
              html: emailHtml,
              text: emailText,
            });
            await adminSupabase
              .from("notification_deliveries")
              .update({
                email_status: "sent",
                in_app_status: "unread",
                delivered_at: new Date().toISOString(),
              } as unknown as never)
              .eq("id", delivery.id);
          } catch {
            await adminSupabase
              .from("notification_deliveries")
              .update({ email_status: "failed" } as unknown as never)
              .eq("id", delivery.id);
          }
        } else {
          await adminSupabase
            .from("notification_deliveries")
            .update({ email_status: "skipped", in_app_status: "unread" } as unknown as never)
            .eq("id", delivery.id);
        }
      }
    }

    // Mark campaign as sent.
    await adminSupabase
      .from("notification_campaigns")
      .update({ status: "sent", completed_at: new Date().toISOString() } as unknown as never)
      .eq("id", campaign.id);

    processed++;
  }

  return NextResponse.json({ ok: true, processed });
}
