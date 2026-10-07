import { describe, expect, it } from "vitest";
import { ApiError } from "@important-dates/core";
import { errorMessage } from "./errors";

const t = (key: string) => `t:${key}`;

describe("errorMessage", () => {
  it("dùng messageKey của ApiError", () => {
    expect(errorMessage(t, new ApiError("auth", "errors.auth.invalidCredentials"))).toBe(
      "t:errors.auth.invalidCredentials",
    );
  });

  it("lỗi lạ thì báo lỗi chung, không lộ nội dung lỗi", () => {
    expect(errorMessage(t, new Error("secret stack"))).toBe("t:errors.generic");
    expect(errorMessage(t, "x")).toBe("t:errors.generic");
  });
});
