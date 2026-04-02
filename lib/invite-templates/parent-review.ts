import { translate, type Locale } from "@/lib/i18n";
import { escapeHtml, type InviteEmailPayload } from "@/lib/invite-templates/shared";

interface BuildParentReviewEmailInput {
  locale: Locale;
  fullName?: string | null;
  homeUrl: string;
}

export function buildParentReviewEmail({ locale, fullName, homeUrl }: BuildParentReviewEmailInput): InviteEmailPayload {
  const safeName = fullName?.trim() || translate(locale, "platform.email.fallbackName");
  const subject = translate(locale, "platform.email.review.subject");
  const heading = translate(locale, "platform.email.review.heading");
  const body = translate(locale, "platform.email.review.body", { name: safeName });
  const cta = translate(locale, "platform.email.review.cta");

  return {
    toEmail: "",
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; color: #003F60; line-height: 1.6;">
        <h1>${escapeHtml(heading)}</h1>
        <p>${escapeHtml(body)}</p>
        <p>
          <a href="${escapeHtml(homeUrl)}" style="display: inline-block; padding: 12px 24px; border-radius: 999px; background: #FDCC00; color: #003F60; font-weight: 700; text-decoration: none;">${escapeHtml(cta)}</a>
        </p>
      </div>
    `.trim(),
    text: `${heading}\n\n${body}\n\n${cta}: ${homeUrl}`,
  };
}