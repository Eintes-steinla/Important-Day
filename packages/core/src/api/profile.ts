import { profileUpdateSchema, type ProfileUpdateInput } from "../schemas";
import type { Profile } from "../models";
import type { AppSupabaseClient } from "./client";
import { toDatabaseError } from "./errors";
import { mapProfileRow, profilePatchToRow } from "./mappers";
import { parseOrThrow } from "./validation";

// Truyền userId tường minh vì Supabase (PostgREST) có thể từ chối UPDATE không có điều kiện WHERE.

export async function getProfile(client: AppSupabaseClient, userId: string): Promise<Profile> {
  const { data, error } = await client.from("profiles").select("*").eq("id", userId).single();
  if (error) throw toDatabaseError(error);
  return mapProfileRow(data);
}

/** Cập nhật một phần profile (ngôn ngữ, giao diện, múi giờ, tên hiển thị). */
export async function updateProfile(
  client: AppSupabaseClient,
  userId: string,
  patch: ProfileUpdateInput,
): Promise<Profile> {
  const parsed = parseOrThrow(profileUpdateSchema, patch);
  const row = profilePatchToRow(parsed);
  if (Object.keys(row).length === 0) return getProfile(client, userId);

  const { data, error } = await client
    .from("profiles")
    .update(row)
    .eq("id", userId)
    .select("*")
    .single();
  if (error) throw toDatabaseError(error);
  return mapProfileRow(data);
}
