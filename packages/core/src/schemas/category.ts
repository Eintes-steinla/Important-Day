import { z } from "zod";
import { DEFAULT_CATEGORY_ICON, DEFAULT_EVENT_COLOR_KEY, LIMITS } from "../constants";

/** Dữ liệu form tạo/sửa danh mục. `color` là khóa trong bảng màu eventColors (vd "rose"). */
export const categoryInputSchema = z.object({
  name: z
    .string("validation.category.nameRequired")
    .trim()
    .min(1, "validation.category.nameRequired")
    .max(LIMITS.categoryNameMax, "validation.category.nameTooLong"),
  color: z.string().trim().min(1).max(LIMITS.tokenMax).default(DEFAULT_EVENT_COLOR_KEY),
  icon: z.string().trim().min(1).max(LIMITS.iconMax).default(DEFAULT_CATEGORY_ICON),
});

/**
 * Chỉ màu và icon. Dùng khi sửa danh mục mặc định mà không đổi tên: giữ `name = null` để tên
 * tiếp tục được dịch theo ngôn ngữ (ghi tên đã dịch xuống DB sẽ làm mất việc đó).
 */
export const categoryAppearanceSchema = categoryInputSchema.pick({ color: true, icon: true });

export type CategoryFormInput = z.input<typeof categoryInputSchema>;
export type CategoryInput = z.output<typeof categoryInputSchema>;
export type CategoryAppearanceFormInput = z.input<typeof categoryAppearanceSchema>;
