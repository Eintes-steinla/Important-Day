import { describe, expect, it } from "vitest";
import en from "../locales/en.json";
import vi from "../locales/vi.json";
import { getCategoryName, resolveEventAppearance } from "./appearance";
import { DEFAULT_CATEGORIES, DEFAULT_CATEGORY_KEYS } from "./constants";
import { createI18n, resolveLanguage } from "./i18n";

type Tree = { [key: string]: string | Tree };

/** Làm phẳng cây JSON thành map "a.b.c" -> chuỗi. */
function flatten(tree: Tree, prefix = ""): Map<string, string> {
  const result = new Map<string, string>();
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") result.set(path, value);
    else for (const [k, v] of flatten(value, path)) result.set(k, v);
  }
  return result;
}

const flatEn = flatten(en as Tree);
const flatVi = flatten(vi as Tree);

const placeholders = (text: string) =>
  [...text.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((m) => m[1]).sort();

describe("file dịch vi và en", () => {
  it("có cùng bộ key", () => {
    expect([...flatVi.keys()].sort()).toEqual([...flatEn.keys()].sort());
  });

  it("không có chuỗi rỗng", () => {
    for (const [key, value] of [...flatEn, ...flatVi]) {
      expect(value.trim(), `chuỗi rỗng: ${key}`).not.toBe("");
    }
  });

  it("biến nội suy {{...}} giống nhau ở cả hai ngôn ngữ", () => {
    for (const [key, enText] of flatEn) {
      expect(placeholders(flatVi.get(key) ?? ""), `biến khác nhau ở ${key}`).toEqual(
        placeholders(enText),
      );
    }
  });

  it("key số nhiều có đủ _one và _other ở cả hai ngôn ngữ", () => {
    for (const flat of [flatEn, flatVi]) {
      for (const key of flat.keys()) {
        if (key.endsWith("_one")) expect(flat.has(key.replace(/_one$/, "_other")), key).toBe(true);
        if (key.endsWith("_other"))
          expect(flat.has(key.replace(/_other$/, "_one")), key).toBe(true);
      }
    }
  });

  it("có tên dịch cho mọi danh mục mặc định", () => {
    for (const key of DEFAULT_CATEGORY_KEYS) {
      expect(flatEn.has(`categories.default.${key}`), key).toBe(true);
      expect(flatVi.has(`categories.default.${key}`), key).toBe(true);
    }
    expect(DEFAULT_CATEGORIES.map((c) => c.key)).toEqual([...DEFAULT_CATEGORY_KEYS]);
  });
});

describe("i18n", () => {
  it("resolveLanguage: vi/en theo locale thiết bị, còn lại fallback en", () => {
    expect(resolveLanguage("vi-VN")).toBe("vi");
    expect(resolveLanguage("vi")).toBe("vi");
    expect(resolveLanguage("en-US")).toBe("en");
    expect(resolveLanguage("fr-FR")).toBe("en");
    expect(resolveLanguage("")).toBe("en");
    expect(resolveLanguage(null)).toBe("en");
    expect(resolveLanguage(undefined)).toBe("en");
  });

  it("đổi ngôn ngữ trong runtime", async () => {
    const instance = createI18n("vi");
    expect(instance.t("settings.theme.dark")).toBe("Tối");
    await instance.changeLanguage("en");
    expect(instance.t("settings.theme.dark")).toBe("Dark");
  });

  it("dịch tên danh mục mặc định theo ngôn ngữ", () => {
    const vi = createI18n("vi");
    const en = createI18n("en");
    const category = { name: null, defaultKey: "birthday" };
    expect(getCategoryName(category, (k, o) => vi.t(k, o) as string)).toBe("Sinh nhật");
    expect(getCategoryName(category, (k, o) => en.t(k, o) as string)).toBe("Birthday");
  });
});

describe("appearance", () => {
  const t = (key: string) => key;

  it("getCategoryName ưu tiên tên người dùng đặt", () => {
    expect(getCategoryName({ name: "Du lịch", defaultKey: null }, t)).toBe("Du lịch");
    expect(getCategoryName({ name: "Sinh nhật bạn", defaultKey: "birthday" }, t)).toBe(
      "Sinh nhật bạn",
    );
    expect(getCategoryName({ name: null, defaultKey: null }, t)).toBe("");
  });

  it("resolveEventAppearance: sự kiện > danh mục > mặc định", () => {
    const category = { color: "rose", icon: "cake" };
    expect(resolveEventAppearance({ color: "sky", icon: "gift" }, category)).toEqual({
      colorKey: "sky",
      icon: "gift",
    });
    expect(resolveEventAppearance({ color: null, icon: null }, category)).toEqual({
      colorKey: "rose",
      icon: "cake",
    });
    expect(resolveEventAppearance({ color: null, icon: "gift" }, category)).toEqual({
      colorKey: "rose",
      icon: "gift",
    });
    expect(resolveEventAppearance({ color: null, icon: null }, null)).toEqual({
      colorKey: "indigo",
      icon: "calendar",
    });
  });
});
