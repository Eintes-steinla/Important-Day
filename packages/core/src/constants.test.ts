import { describe, expect, it } from "vitest";
import {
  DEFAULT_CATEGORIES,
  DEFAULT_CATEGORY_ICON,
  DEFAULT_EVENT_ICON,
  EVENT_ICON_NAMES,
  LIMITS,
} from "./constants";

describe("EVENT_ICON_NAMES", () => {
  it("không trùng và đúng dạng tên Lucide kebab-case", () => {
    expect(new Set(EVENT_ICON_NAMES).size).toBe(EVENT_ICON_NAMES.length);
    for (const name of EVENT_ICON_NAMES) {
      expect(name, name).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(name.length, name).toBeLessThanOrEqual(LIMITS.iconMax);
    }
  });

  it("có icon mặc định của sự kiện, danh mục và danh mục mặc định", () => {
    const names: readonly string[] = EVENT_ICON_NAMES;
    expect(names).toContain(DEFAULT_EVENT_ICON);
    expect(names).toContain(DEFAULT_CATEGORY_ICON);
    for (const category of DEFAULT_CATEGORIES) expect(names, category.key).toContain(category.icon);
  });
});
