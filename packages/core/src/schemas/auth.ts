import { z } from "zod";
import { LIMITS } from "../constants";
import { languageSchema, optionalText } from "./common";

const emailSchema = z
  .string("validation.email.invalid")
  .trim()
  .toLowerCase()
  .pipe(z.email("validation.email.invalid"));

export const signInSchema = z.object({
  email: emailSchema,
  // Đăng nhập không kiểm tra độ dài tối thiểu để không chặn tài khoản cũ
  password: z.string("validation.password.required").min(1, "validation.password.required"),
});

export const signUpSchema = z.object({
  email: emailSchema,
  password: z
    .string("validation.password.required")
    .min(LIMITS.passwordMin, "validation.password.tooShort")
    .max(LIMITS.passwordMax, "validation.password.tooLong"),
  displayName: optionalText(LIMITS.displayNameMax, "validation.displayName.tooLong"),
  /** Ngôn ngữ hiện tại của app, lưu vào profiles.language ngay khi đăng ký. */
  language: languageSchema.optional(),
});

export type SignInInput = z.output<typeof signInSchema>;
export type SignUpFormInput = z.input<typeof signUpSchema>;
export type SignUpInput = z.output<typeof signUpSchema>;
