import { describe, expect, it } from "vitest";
import { EVENT_ICON_NAMES } from "@important-dates/core";
import { ICONS, getIcon } from "./icons";

describe("ICONS", () => {
  it("có icon cho mọi tên trong EVENT_ICON_NAMES và không thừa tên nào", () => {
    expect(Object.keys(ICONS).sort()).toEqual([...EVENT_ICON_NAMES].sort());
  });

  it("tên lạ hoặc rỗng dùng icon mặc định thay vì lỗi", () => {
    expect(getIcon("khong-co-icon-nay")).toBe(ICONS.calendar);
    expect(getIcon(null)).toBe(ICONS.calendar);
    expect(getIcon("cake")).toBe(ICONS.cake);
  });
});
