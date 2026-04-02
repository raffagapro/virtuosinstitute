const PUBLIC_URL_KEY = "NEXT_PUBLIC_SUPABASE_URL";
const PUBLIC_ANON_KEY = "NEXT_PUBLIC_SUPABASE_ANON_KEY";
const SERVICE_ROLE_KEY = "SUPABASE_SERVICE_ROLE_KEY";

function readRequiredEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getSupabasePublicEnv() {
  // NEXT_PUBLIC_* values must be read through static property access so Next can inline them in client bundles.
  const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publicAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return {
    url: readRequiredEnv(PUBLIC_URL_KEY, publicUrl),
    anonKey: readRequiredEnv(PUBLIC_ANON_KEY, publicAnonKey),
  };
}

export function getSupabaseServiceRoleKey() {
  return readRequiredEnv(SERVICE_ROLE_KEY, process.env.SUPABASE_SERVICE_ROLE_KEY);
}
