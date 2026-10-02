"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logger } from "@/lib/logger";
import { GENERIC_ERROR } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { ONBOARDING_STEPS, LIMITS, type StepKey } from "./constants";
import { MAX_UPLOAD_BYTES, sniffImageType } from "./images";
import {
  aboutSchema,
  interestsSchema,
  locationSchema,
  lookingForSchema,
} from "./schemas";
import type { FormState } from "./types";

type Mode = "onboarding" | "edit";

function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v : "";
}
function strs(fd: FormData, key: string): string[] {
  return fd.getAll(key).filter((v): v is string => typeof v === "string");
}
function echo(fd: FormData): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  for (const key of new Set(fd.keys())) {
    if (key.startsWith("$ACTION")) continue;
    const all = fd.getAll(key).filter((v): v is string => typeof v === "string");
    if (all.length > 0) out[key] = all.length > 1 ? all : all[0];
  }
  return out;
}
function mode(fd: FormData): Mode {
  return str(fd, "mode") === "edit" ? "edit" : "onboarding";
}

function fieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const key = String(i.path[0] ?? "form");
    if (!out[key]) out[key] = i.message;
  }
  return out;
}

/** Database messages we raise on purpose, mapped to friendly text. Raw errors are only logged. */
function dbMessage(error: { code?: string; message?: string }): string {
  const m = error.message ?? "";
  if (m.includes("too_many_interests")) return `You can choose up to ${LIMITS.interests} interests.`;
  if (m.includes("too_many_photos")) return `You can add up to ${LIMITS.photos} photos.`;
  if (m.includes("invalid_location")) return "Please choose a valid location.";
  if (m.includes("incomplete_profile"))
    return "Please add who you are, what you are looking for and where you live first.";
  return GENERIC_ERROR;
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/app");
  return { supabase, user };
}

/** After a successful save: next wizard step, or back to the profile when editing. */
function advance(m: Mode, current: StepKey): never {
  revalidatePath("/app", "layout");
  if (m === "edit") redirect("/app/profile");
  const idx = ONBOARDING_STEPS.findIndex((s) => s.key === current);
  redirect(`/app/onboarding?step=${Math.min(idx + 2, ONBOARDING_STEPS.length)}`);
}

async function markStep(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  step: StepKey,
  m: Mode,
) {
  if (m !== "onboarding") return;
  const idx = ONBOARDING_STEPS.findIndex((s) => s.key === step);
  // Only ever moves forward; users can't skip the final completion call.
  await supabase
    .from("profiles")
    .update({ onboarding_step: idx + 1 })
    .eq("id", userId)
    .lt("onboarding_step", idx + 1);
}

export async function saveAboutAction(_p: FormState, fd: FormData): Promise<FormState> {
  const parsed = aboutSchema.safeParse({
    gender: str(fd, "gender"),
    bio: str(fd, "bio"),
    occupation: str(fd, "occupation"),
    education: str(fd, "education"),
    languages: strs(fd, "languages"),
    smoking: str(fd, "smoking"),
    drinking: str(fd, "drinking"),
    children_preference: str(fd, "children_preference"),
    phone: str(fd, "phone"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues), values: echo(fd) };
  const { phone, ...profileFields } = parsed.data;
  const { supabase, user } = await requireUser();

  const { error } = await supabase
    .from("profiles")
    .update({
      gender: profileFields.gender as "man" | "woman" | "non_binary",
      bio: profileFields.bio,
      occupation: profileFields.occupation,
      education: profileFields.education,
      languages: profileFields.languages,
      smoking: profileFields.smoking as "never" | "sometimes" | "often" | "prefer_not_to_say" | null,
      drinking: profileFields.drinking as "never" | "sometimes" | "often" | "prefer_not_to_say" | null,
      children_preference: profileFields.children_preference as
        | "have_children" | "want_children" | "open_to_children" | "no_children" | "prefer_not_to_say" | null,
    })
    .eq("id", user.id);
  if (error) {
    logger.error("profile.about_save_failed", { code: error.code });
    return { error: dbMessage(error), values: echo(fd) };
  }

  // Private phone number: insert/update/delete explicitly (an upsert would need
  // update rights on user_id, which users deliberately do not have).
  const { data: existing } = await supabase
    .from("user_contacts")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  let contactError: { code?: string; message?: string } | null = null;
  if (phone === null) {
    if (existing) {
      contactError = (await supabase.from("user_contacts").delete().eq("user_id", user.id)).error;
    }
  } else if (existing) {
    contactError = (await supabase.from("user_contacts").update({ phone_e164: phone }).eq("user_id", user.id)).error;
  } else {
    contactError = (await supabase.from("user_contacts").insert({ user_id: user.id, phone_e164: phone })).error;
  }
  if (contactError) {
    logger.error("profile.contact_save_failed", { code: contactError.code });
    return { error: GENERIC_ERROR, values: echo(fd) };
  }

  const m = mode(fd);
  await markStep(supabase, user.id, "about", m);
  advance(m, "about");
}

export async function saveInterestsAction(_p: FormState, fd: FormData): Promise<FormState> {
  const parsed = interestsSchema.safeParse({ interests: strs(fd, "interests") });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues), values: echo(fd) };
  const wanted = Array.from(new Set(parsed.data.interests));
  const { supabase, user } = await requireUser();

  if (wanted.length > 0) {
    const { data: valid } = await supabase.from("interests").select("id").in("id", wanted).eq("is_active", true);
    if ((valid?.length ?? 0) !== wanted.length) return { error: GENERIC_ERROR, values: echo(fd) };
  }

  const { data: current, error: readError } = await supabase
    .from("user_interests")
    .select("interest_id")
    .eq("user_id", user.id);
  if (readError) {
    logger.error("profile.interests_read_failed", { code: readError.code });
    return { error: GENERIC_ERROR, values: echo(fd) };
  }
  const have = new Set((current ?? []).map((r) => r.interest_id));
  const toRemove = [...have].filter((id) => !wanted.includes(id));
  const toAdd = wanted.filter((id) => !have.has(id));

  if (toRemove.length > 0) {
    const { error } = await supabase
      .from("user_interests").delete().eq("user_id", user.id).in("interest_id", toRemove);
    if (error) {
      logger.error("profile.interests_remove_failed", { code: error.code });
      return { error: GENERIC_ERROR, values: echo(fd) };
    }
  }
  if (toAdd.length > 0) {
    const { error } = await supabase
      .from("user_interests").insert(toAdd.map((interest_id) => ({ user_id: user.id, interest_id })));
    if (error) {
      logger.error("profile.interests_add_failed", { code: error.code });
      return { error: dbMessage(error), values: echo(fd) };
    }
  }

  const m = mode(fd);
  await markStep(supabase, user.id, "interests", m);
  advance(m, "interests");
}

export async function saveLookingForAction(_p: FormState, fd: FormData): Promise<FormState> {
  const parsed = lookingForSchema.safeParse({
    intention_primary: str(fd, "intention_primary"),
    intentions_extra: strs(fd, "intentions_extra"),
    seeking_genders: strs(fd, "seeking_genders"),
    age_min: str(fd, "age_min"),
    age_max: str(fd, "age_max"),
    appear_local: fd.get("appear_local") === "on",
    appear_liberia: fd.get("appear_liberia") === "on",
    appear_diaspora: fd.get("appear_diaspora") === "on",
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues), values: echo(fd) };
  const v = parsed.data;
  const { supabase, user } = await requireUser();

  const a = await supabase
    .from("profiles")
    .update({
      intention_primary: v.intention_primary as "serious_relationship" | "marriage" | "dating" | "friendship" | "getting_to_know",
      intentions_extra: v.intentions_extra as ("serious_relationship" | "marriage" | "dating" | "friendship" | "getting_to_know")[],
    })
    .eq("id", user.id);
  const b = await supabase
    .from("preferences")
    .update({
      seeking_genders: v.seeking_genders as ("man" | "woman" | "non_binary")[],
      age_min: v.age_min,
      age_max: v.age_max,
      appear_local: v.appear_local,
      appear_liberia: v.appear_liberia,
      appear_diaspora: v.appear_diaspora,
    })
    .eq("user_id", user.id);
  const failed = a.error ?? b.error;
  if (failed) {
    logger.error("profile.looking_save_failed", { code: failed.code });
    return { error: dbMessage(failed), values: echo(fd) };
  }

  const m = mode(fd);
  await markStep(supabase, user.id, "looking", m);
  advance(m, "looking");
}

export async function saveLocationAction(_p: FormState, fd: FormData): Promise<FormState> {
  const parsed = locationSchema.safeParse({
    country_id: str(fd, "country_id"),
    region_id: str(fd, "region_id"),
    city_id: str(fd, "city_id"),
    community_id: str(fd, "community_id"),
    city_other: str(fd, "city_other"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues), values: echo(fd) };
  const v = parsed.data;
  const { supabase, user } = await requireUser();

  const { data: country } = await supabase
    .from("locations").select("iso_code").eq("id", v.country_id).eq("kind", "country").maybeSingle();
  if (!country) return { fieldErrors: { country_id: "Please choose your country." }, values: echo(fd) };

  const isLiberia = country.iso_code === "LR";
  if (isLiberia) {
    if (!v.region_id) return { fieldErrors: { region_id: "Please choose your county." }, values: echo(fd) };
    if (!v.city_id) return { fieldErrors: { city_id: "Please choose your city or town." }, values: echo(fd) };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      country_id: v.country_id,
      region_id: isLiberia ? v.region_id : null,
      city_id: isLiberia ? v.city_id : null,
      community_id: isLiberia ? v.community_id : null,
      // Free-text town is only for places outside our seeded list.
      city_other: isLiberia ? null : v.city_other,
    })
    .eq("id", user.id);
  if (error) {
    logger.error("profile.location_save_failed", { code: error.code });
    return { error: dbMessage(error), values: echo(fd) };
  }

  const m = mode(fd);
  await markStep(supabase, user.id, "location", m);
  advance(m, "location");
}

/** Final onboarding call: the DATABASE decides whether the minimum is met. */
export async function finishOnboardingAction(_p: FormState, _fd: FormData): Promise<FormState> {
  void _fd;
  const { supabase, user } = await requireUser();
  const { error } = await supabase.rpc("complete_onboarding");
  if (error) {
    logger.warn("profile.complete_failed", { code: error.code });
    return { error: dbMessage(error) };
  }
  await supabase.from("profiles").update({ onboarding_step: ONBOARDING_STEPS.length }).eq("id", user.id);
  revalidatePath("/app", "layout");
  redirect("/app");
}

/* ------------------------------ Photos ------------------------------ */

export async function uploadPhotoAction(_p: FormState, fd: FormData): Promise<FormState> {
  const file = fd.get("photo");
  if (!(file instanceof File) || file.size === 0) return { error: "Please choose a photo." };
  if (file.size > MAX_UPLOAD_BYTES) return { error: "That photo is too large. Please choose a smaller one." };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniffImageType(bytes);
  // Server-side truth: only real JPEG/WebP bytes are accepted, whatever the browser claims.
  if (kind !== "jpeg" && kind !== "webp") {
    return { error: "Please upload a JPEG, PNG or WebP photo." };
  }

  const { supabase, user } = await requireUser();
  const { data: existing, error: readError } = await supabase
    .from("profile_photos").select("position").eq("user_id", user.id);
  if (readError) {
    logger.error("photo.read_failed", { code: readError.code });
    return { error: GENERIC_ERROR };
  }
  if ((existing?.length ?? 0) >= LIMITS.photos) {
    return { error: `You can add up to ${LIMITS.photos} photos.` };
  }
  const taken = new Set((existing ?? []).map((r) => r.position));
  let position = 0;
  while (taken.has(position)) position += 1;

  const ext = kind === "webp" ? "webp" : "jpg";
  const path = `${user.id}/${randomUUID()}.${ext}`;
  const up = await supabase.storage.from("profile-photos").upload(path, bytes, {
    contentType: kind === "webp" ? "image/webp" : "image/jpeg",
    upsert: false,
    cacheControl: "3600",
  });
  if (up.error) {
    logger.error("photo.upload_failed", { message: up.error.message });
    return { error: GENERIC_ERROR };
  }

  const dim = (k: string) => {
    const n = Number.parseInt(str(fd, k), 10);
    return Number.isInteger(n) && n >= 1 && n <= 4096 ? n : null;
  };
  const { error: insertError } = await supabase.from("profile_photos").insert({
    user_id: user.id,
    storage_path: path,
    position,
    width: dim("width"),
    height: dim("height"),
    size_bytes: file.size,
  });
  if (insertError) {
    logger.error("photo.insert_failed", { code: insertError.code });
    await supabase.storage.from("profile-photos").remove([path]); // no orphaned files
    return { error: dbMessage(insertError) };
  }

  revalidatePath("/app", "layout");
  return { success: true, message: "Photo added." };
}

export async function deletePhotoAction(_p: FormState, fd: FormData): Promise<FormState> {
  const id = str(fd, "photo_id");
  if (!/^[0-9a-f-]{36}$/.test(id)) return { error: GENERIC_ERROR };
  const { supabase } = await requireUser();

  const { data: path, error } = await supabase.rpc("delete_profile_photo", { p_photo_id: id });
  if (error) {
    logger.error("photo.delete_failed", { code: error.code });
    return { error: GENERIC_ERROR };
  }
  if (path) await supabase.storage.from("profile-photos").remove([path]);
  revalidatePath("/app", "layout");
  return { success: true, message: "Photo removed." };
}

export async function makeMainPhotoAction(_p: FormState, fd: FormData): Promise<FormState> {
  const id = str(fd, "photo_id");
  if (!/^[0-9a-f-]{36}$/.test(id)) return { error: GENERIC_ERROR };
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("set_main_photo", { p_photo_id: id });
  if (error) {
    logger.error("photo.main_failed", { code: error.code });
    return { error: GENERIC_ERROR };
  }
  revalidatePath("/app", "layout");
  return { success: true, message: "Main photo updated." };
}
