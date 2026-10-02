import type { SupabaseClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import type { Database, Row } from "@/types/database";

type Client = SupabaseClient<Database>;

export type PhotoWithUrl = Row<"profile_photos"> & { url: string | null };

export type ProfileBundle = {
  profile: Row<"profiles">;
  preferences: Row<"preferences"> | null;
  phone: string | null;
  interestIds: string[];
  photos: PhotoWithUrl[];
};

const PHOTO_URL_TTL_SECONDS = 3600;

/** Everything the signed-in user's own profile screens need, fetched in parallel (RLS-scoped). */
export async function getProfileBundle(
  supabase: Client,
  userId: string,
): Promise<ProfileBundle | null> {
  const [profile, preferences, contact, interests, photos] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("preferences").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("user_contacts").select("phone_e164").eq("user_id", userId).maybeSingle(),
    supabase.from("user_interests").select("interest_id").eq("user_id", userId),
    supabase.from("profile_photos").select("*").eq("user_id", userId).order("position"),
  ]);

  for (const [name, r] of Object.entries({ profile, preferences, contact, interests, photos })) {
    if (r.error) logger.error("profile.bundle_read_failed", { part: name, code: r.error.code });
  }
  if (!profile.data) return null;

  const rows = photos.data ?? [];
  let urls: Record<string, string> = {};
  if (rows.length > 0) {
    const signed = await supabase.storage
      .from("profile-photos")
      .createSignedUrls(rows.map((p) => p.storage_path), PHOTO_URL_TTL_SECONDS);
    if (signed.error) {
      logger.error("profile.photo_sign_failed", { message: signed.error.message });
    } else {
      urls = Object.fromEntries(
        (signed.data ?? []).flatMap((d) => (d.path && d.signedUrl ? [[d.path, d.signedUrl]] : [])),
      );
    }
  }

  return {
    profile: profile.data,
    preferences: preferences.data ?? null,
    phone: contact.data?.phone_e164 ?? null,
    interestIds: (interests.data ?? []).map((i) => i.interest_id),
    photos: rows.map((p) => ({ ...p, url: urls[p.storage_path] ?? null })),
  };
}

export type LocationOption = Pick<Row<"locations">, "id" | "parent_id" | "kind" | "name" | "iso_code">;

/** All active locations (small reference table, ~80 rows): one query, filtered on the client. */
export async function getLocations(supabase: Client): Promise<LocationOption[]> {
  const { data, error } = await supabase
    .from("locations")
    .select("id, parent_id, kind, name, iso_code")
    .eq("is_active", true)
    .order("sort_order")
    .order("name");
  if (error) logger.error("locations.read_failed", { code: error.code });
  return data ?? [];
}

export type InterestOption = Pick<Row<"interests">, "id" | "label" | "category">;

export async function getInterests(supabase: Client): Promise<InterestOption[]> {
  const { data, error } = await supabase
    .from("interests")
    .select("id, label, category")
    .eq("is_active", true)
    .order("sort_order");
  if (error) logger.error("interests.read_failed", { code: error.code });
  return data ?? [];
}

/** "Paynesville, Montserrado" / "London, United Kingdom": approximate place only. */
export function formatPlace(
  profile: Pick<Row<"profiles">, "country_id" | "region_id" | "city_id" | "community_id" | "city_other">,
  locations: LocationOption[],
): string | null {
  const byId = new Map(locations.map((l) => [l.id, l]));
  const name = (id: string | null) => (id ? byId.get(id)?.name : undefined);
  const country = name(profile.country_id);
  if (!country) return null;
  const city = name(profile.city_id) ?? profile.city_other ?? undefined;
  const region = name(profile.region_id);
  const isLiberia = byId.get(profile.country_id!)?.iso_code === "LR";
  const parts = isLiberia
    ? [city, region ?? country]
    : [city, country];
  return parts.filter(Boolean).join(", ");
}
