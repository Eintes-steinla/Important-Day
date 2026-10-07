import {
  categoryAppearanceSchema,
  categoryInputSchema,
  type CategoryAppearanceFormInput,
  type CategoryFormInput,
} from "../schemas";
import type { Category } from "../models";
import type { AppSupabaseClient } from "./client";
import { toDatabaseError } from "./errors";
import { categoryInputToRow, mapCategoryRow } from "./mappers";
import { parseOrThrow } from "./validation";

export async function listCategories(client: AppSupabaseClient): Promise<Category[]> {
  const { data, error } = await client
    .from("categories")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw toDatabaseError(error);
  return data.map(mapCategoryRow);
}

export async function createCategory(
  client: AppSupabaseClient,
  input: CategoryFormInput,
): Promise<Category> {
  const parsed = parseOrThrow(categoryInputSchema, input);
  const { data, error } = await client
    .from("categories")
    .insert(categoryInputToRow(parsed))
    .select("*")
    .single();
  if (error) throw toDatabaseError(error);
  return mapCategoryRow(data);
}

/** Đổi tên/màu/icon. Với danh mục mặc định, việc đặt tên sẽ thay cho tên dịch sẵn. */
export async function updateCategory(
  client: AppSupabaseClient,
  id: string,
  input: CategoryFormInput,
): Promise<Category> {
  const parsed = parseOrThrow(categoryInputSchema, input);
  const { data, error } = await client
    .from("categories")
    .update(categoryInputToRow(parsed))
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw toDatabaseError(error);
  return mapCategoryRow(data);
}

/** Chỉ đổi màu và icon, không đụng vào `name` (xem categoryAppearanceSchema). */
export async function updateCategoryAppearance(
  client: AppSupabaseClient,
  id: string,
  input: CategoryAppearanceFormInput,
): Promise<Category> {
  const parsed = parseOrThrow(categoryAppearanceSchema, input);
  const { data, error } = await client
    .from("categories")
    .update({ color: parsed.color, icon: parsed.icon })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw toDatabaseError(error);
  return mapCategoryRow(data);
}

/** Xóa danh mục: sự kiện thuộc danh mục được giữ lại và category_id về null (ON DELETE SET NULL). */
export async function deleteCategory(client: AppSupabaseClient, id: string): Promise<void> {
  const { error } = await client.from("categories").delete().eq("id", id);
  if (error) throw toDatabaseError(error);
}
