import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { EventLeaf } from "./EventLeaf";
import { renderWithProviders } from "../test/render";

describe("EventLeaf", () => {
  it("hiện tháng và ngày, ẩn khỏi trình đọc màn hình (nhãn nằm ở dòng cha)", () => {
    const { container } = renderWithProviders(<EventLeaf day={7} month={10} colorKey="rose" />);
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText(/10/, { selector: "span" })).toBeInTheDocument();
    expect(container.querySelector("[aria-hidden=true]")).not.toBeNull();
  });
});
