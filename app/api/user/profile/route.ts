import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseAdminClient } from "@/lib/supabase";

interface ProfileResponse {
  ok: boolean;
  profile?: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    dateOfBirth: string | null;
    preferredLocale: string;
    platformRole: string | null;
  };
  parentProfile?: {
    curp: string;
    rfc: string | null;
    profession: string | null;
    invoiceRequired: boolean;
    dateOfBirth: string | null;
  };
  error?: string;
}

interface UpdateProfileRequest {
  fullName?: string;
  phone?: string;
  dateOfBirth?: string | null;
  preferredLocale?: string;
  curp?: string;
  rfc?: string;
  profession?: string;
  invoiceRequired?: boolean;
}

function getBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization") ?? "";
  const [scheme, token] = authHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
}

function isMissingColumnError(error: unknown, columnName: string): boolean {
  const dbError = error as unknown as { code?: string; message?: string } | null;
  if (!dbError) return false;

  if (dbError.code === "42703") return true;
  return (dbError.message || "").toLowerCase().includes(columnName.toLowerCase());
}

/**
 * GET /api/user/profile
 * Fetch the current user's profile information
 */
export async function GET(request: NextRequest): Promise<NextResponse<ProfileResponse>> {
  try {
    const accessToken = getBearerToken(request);
    if (!accessToken) {
      return NextResponse.json(
        { ok: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const supabase = getSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken);

    if (userError || !user?.id) {
      return NextResponse.json(
        { ok: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const adminSupabase = getSupabaseAdminClient() as any;

    // Fetch base profile
    const { data: profile, error: profileError } = await adminSupabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { ok: false, error: "Profile not found" },
        { status: 404 }
      );
    }

    const response: ProfileResponse = {
      ok: true,
      profile: {
        id: profile.id,
        fullName: profile.full_name,
        email: profile.email || user.email || "",
        phone: profile.phone,
        dateOfBirth: profile.date_of_birth ?? null,
        preferredLocale: profile.preferred_locale,
        platformRole: profile.platform_role,
      },
    };

    // Check if user is a parent and fetch parent-specific fields
    const { data: membershipRoles } = await adminSupabase
      .from("school_memberships")
      .select("school_role")
      .eq("profile_id", user.id);

    const isParent = membershipRoles?.some((m: { school_role: string }) => m.school_role === "parent");

    if (isParent) {
      const { data: parentProfile } = await adminSupabase
        .from("parent_profiles")
        .select("curp, rfc, profession, invoice_required, date_of_birth")
        .eq("profile_id", user.id)
        .single();

      if (parentProfile) {
        response.parentProfile = {
          curp: parentProfile.curp,
          rfc: parentProfile.rfc,
          profession: parentProfile.profession,
          invoiceRequired: parentProfile.invoice_required,
          dateOfBirth: parentProfile.date_of_birth ?? null,
        };
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user/profile
 * Update the current user's profile information
 */
export async function PATCH(request: NextRequest): Promise<NextResponse<ProfileResponse>> {
  try {
    const accessToken = getBearerToken(request);
    if (!accessToken) {
      return NextResponse.json(
        { ok: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const supabase = getSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken);

    if (userError || !user?.id) {
      return NextResponse.json(
        { ok: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const adminSupabase = getSupabaseAdminClient() as any;
    const body = (await request.json()) as UpdateProfileRequest;

    // Update base profile fields
    const profileUpdates: Record<string, unknown> = {};
    if (body.fullName) profileUpdates.full_name = body.fullName;
    if (body.phone !== undefined) profileUpdates.phone = body.phone || null;
    if (body.dateOfBirth !== undefined) profileUpdates.date_of_birth = body.dateOfBirth || null;
    if (body.preferredLocale) profileUpdates.preferred_locale = body.preferredLocale;

    if (Object.keys(profileUpdates).length > 0) {
      const { error: updateError } = await adminSupabase
        .from("profiles")
        .update(profileUpdates)
        .eq("id", user.id);

      if (updateError) {
        if (profileUpdates.date_of_birth !== undefined && isMissingColumnError(updateError, "date_of_birth")) {
          const { date_of_birth, ...fallbackUpdates } = profileUpdates;

          if (Object.keys(fallbackUpdates).length > 0) {
            const { error: fallbackError } = await adminSupabase
              .from("profiles")
              .update(fallbackUpdates)
              .eq("id", user.id);

            if (fallbackError) {
              return NextResponse.json(
                { ok: false, error: `Failed to update profile: ${fallbackError.message}` },
                { status: 500 }
              );
            }
          }
        } else {
          return NextResponse.json(
            { ok: false, error: `Failed to update profile: ${updateError.message}` },
            { status: 500 }
          );
        }
      }
    }

    // Check if user is a parent and update parent-specific fields
    const { data: membershipRoles } = await adminSupabase
      .from("school_memberships")
      .select("school_role")
      .eq("profile_id", user.id);

    const isParent = membershipRoles?.some((m: { school_role: string }) => m.school_role === "parent");

    const hasParentFieldInPayload =
      Object.prototype.hasOwnProperty.call(body, "curp") ||
      Object.prototype.hasOwnProperty.call(body, "rfc") ||
      Object.prototype.hasOwnProperty.call(body, "profession") ||
      Object.prototype.hasOwnProperty.call(body, "invoiceRequired");

    if (isParent && hasParentFieldInPayload) {
      const parentUpdates: Record<string, unknown> = {};
      if (body.curp) parentUpdates.curp = body.curp;
      if (body.rfc) parentUpdates.rfc = body.rfc;
      if (body.profession !== undefined) parentUpdates.profession = body.profession || null;
      if (body.invoiceRequired !== undefined) parentUpdates.invoice_required = body.invoiceRequired;

      // Ensure parent profile exists or create it
      const { data: existingParentProfile } = await adminSupabase
        .from("parent_profiles")
        .select("profile_id")
        .eq("profile_id", user.id)
        .single();

      if (!existingParentProfile) {
        if (!body.curp || body.curp.trim().length === 0) {
          return NextResponse.json(
            { ok: false, error: "CURP is required to create a parent profile" },
            { status: 400 }
          );
        }

        const { error: createError } = await adminSupabase
          .from("parent_profiles")
          .insert({
            profile_id: user.id,
            curp: body.curp,
            rfc: body.rfc || null,
            profession: body.profession || null,
            invoice_required: body.invoiceRequired || false,
          });

        if (createError) {
          return NextResponse.json(
            { ok: false, error: "Failed to create parent profile" },
            { status: 500 }
          );
        }
      } else if (Object.keys(parentUpdates).length > 0) {
        const { error: updateError } = await adminSupabase
          .from("parent_profiles")
          .update(parentUpdates)
          .eq("profile_id", user.id);

        if (updateError) {
          return NextResponse.json(
            { ok: false, error: `Failed to update parent profile: ${updateError.message}` },
            { status: 500 }
          );
        }
      }
    }

    // Fetch and return updated profile
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { ok: false, error: "Profile not found" },
        { status: 404 }
      );
    }

    const response: ProfileResponse = {
      ok: true,
      profile: {
        id: profile.id,
        fullName: profile.full_name,
        email: profile.email || user.email || "",
        phone: profile.phone,
        dateOfBirth: profile.date_of_birth ?? null,
        preferredLocale: profile.preferred_locale,
        platformRole: profile.platform_role,
      },
    };

    if (isParent) {
      const { data: parentProfile } = await adminSupabase
        .from("parent_profiles")
        .select("curp, rfc, profession, invoice_required, date_of_birth")
        .eq("profile_id", user.id)
        .single();

      if (parentProfile) {
        response.parentProfile = {
          curp: parentProfile.curp,
          rfc: parentProfile.rfc,
          profession: parentProfile.profession,
          invoiceRequired: parentProfile.invoice_required,
          dateOfBirth: parentProfile.date_of_birth ?? null,
        };
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
