import { eventInputSchema, type EventFormInput } from "../schemas";
import type { EventItem } from "../models";
import type { AppSupabaseClient } from "./client";
import { toDatabaseError } from "./errors";
import { eventInputToRow, mapEventRow, type EventWriteExtras } from "./mappers";
import { parseOrThrow } from "./validation";

// RLS đảm bảo mọi truy vấn chỉ chạm vào sự kiện của user đang đăng nhập.

export async function listEvents(client: AppSupabaseClient): Promise<EventItem[]> {
  const { data, error } = await client
    .from("events")
    .select("*")
    .order("next_occurrence", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });
  if (error) throw toDatabaseError(error);
  return data.map(mapEventRow);
}

export async function getEvent(client: AppSupabaseClient, id: string): Promise<EventItem> {
  const { data, error } = await client.from("events").select("*").eq("id", id).single();
  if (error) throw toDatabaseError(error);
  return mapEventRow(data);
}

export async function createEvent(
  client: AppSupabaseClient,
  input: EventFormInput,
  extras?: EventWriteExtras,
): Promise<EventItem> {
  const parsed = parseOrThrow(eventInputSchema, input);
  const { data, error } = await client
    .from("events")
    .insert(eventInputToRow(parsed, extras))
    .select("*")
    .single();
  if (error) throw toDatabaseError(error);
  return mapEventRow(data);
}

/** Ghi đè toàn bộ trường của sự kiện bằng dữ liệu form (dương lịch: DB tính lại next_occurrence). */
export async function updateEvent(
  client: AppSupabaseClient,
  id: string,
  input: EventFormInput,
  extras?: EventWriteExtras,
): Promise<EventItem> {
  const parsed = parseOrThrow(eventInputSchema, input);
  const { data, error } = await client
    .from("events")
    .update(eventInputToRow(parsed, extras))
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw toDatabaseError(error);
  return mapEventRow(data);
}

export async function deleteEvent(client: AppSupabaseClient, id: string): Promise<void> {
  const { error } = await client.from("events").delete().eq("id", id);
  if (error) throw toDatabaseError(error);
}
