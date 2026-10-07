/** Khóa danh mục mặc định, khớp hàm SQL seed_default_categories (có test đối chiếu). */
export const DEFAULT_CATEGORY_KEYS = ["birthday", "anniversary", "memorial", "deadline"] as const;
export type DefaultCategoryKey = (typeof DEFAULT_CATEGORY_KEYS)[number];

/** Danh mục mặc định: tên hiển thị lấy từ locales `categories.default.<key>`. */
export const DEFAULT_CATEGORIES: ReadonlyArray<{
  key: DefaultCategoryKey;
  color: string;
  icon: string;
}> = [
  { key: "birthday", color: "rose", icon: "cake" },
  { key: "anniversary", color: "purple", icon: "heart" },
  { key: "memorial", color: "indigo", icon: "flower-2" },
  { key: "deadline", color: "orange", icon: "alarm-clock" },
];

/** Giới hạn dữ liệu, khớp ràng buộc ở DB. */
export const LIMITS = {
  titleMax: 200,
  noteMax: 5000,
  categoryNameMax: 60,
  displayNameMax: 100,
  tokenMax: 32,
  iconMax: 64,
  remindDaysMax: 365,
  remindCountMax: 10,
  yearMin: 1,
  yearMax: 9999,
  passwordMin: 8,
  // bcrypt (Supabase Auth) chỉ dùng 72 byte đầu của mật khẩu
  passwordMax: 72,
} as const;

/**
 * Icon cho người dùng chọn (tên Lucide dạng kebab-case, lưu nguyên chuỗi này ở DB). Web và mobile
 * tự ánh xạ tên sang component; có test ở web để đảm bảo mọi tên đều có icon. Tên lạ vẫn hiển
 * thị được nhờ icon mặc định, nên bớt tên khỏi danh sách không làm hỏng dữ liệu cũ.
 */
export const EVENT_ICON_NAMES = [
  "calendar",
  "cake",
  "cake-slice",
  "gift",
  "party-popper",
  "heart",
  "heart-handshake",
  "gem",
  "baby",
  "graduation-cap",
  "briefcase",
  "alarm-clock",
  "file-text",
  "wallet",
  "plane",
  "car",
  "house",
  "flower-2",
  "flame",
  "sprout",
  "star",
  "trophy",
  "crown",
  "music",
  "camera",
  "book-open",
  "utensils",
  "coffee",
  "dumbbell",
  "stethoscope",
  "users",
  "dog",
  "cat",
  "sun",
  "moon",
  "bell",
  "flag",
  "map-pin",
  "shopping-bag",
  "tag",
] as const;

export type EventIconName = (typeof EVENT_ICON_NAMES)[number];

export const DEFAULT_REMIND_DAYS_BEFORE: readonly number[] = [0];
export const DEFAULT_EVENT_COLOR_KEY = "indigo";
export const DEFAULT_CATEGORY_ICON = "tag";
export const DEFAULT_EVENT_ICON = "calendar";
