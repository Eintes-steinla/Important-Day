import { z } from "zod";
import { LIMITS } from "../constants";
import { isValidTimeZone } from "../date/timezone";
import { languageSchema, optionalText, themePreferenceSchema } from "./common";

/** Cập nhật một phần profile: chỉ các trường được truyền mới bị đổi. */
export const profileUpdateSchema = z
  .object({
    displayName: optionalText(LIMITS.displayNameMax, "validation.displayName.tooLong"),
    language: languageSchema,
    theme: themePreferenceSchema,
    timezone: z.string().refine(isValidTimeZone, "validation.timezone.invalid"),
  })
  .partial();

export type ProfileUpdateInput = z.output<typeof profileUpdateSchema>;
