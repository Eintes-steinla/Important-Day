import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { getUpcomingOccurrences, type EventItem } from "@important-dates/core";
import { UpcomingList } from "./UpcomingList";
import { renderWithProviders } from "../test/render";

function makeEvent(
  id: string,
  title: string,
  day: number,
  month: number,
  year: number | null,
): EventItem {
  return {
    id,
    categoryId: null,
    title,
    note: null,
    calendarType: "solar",
    day,
    month,
    year,
    isLeapMonth: false,
    color: null,
    icon: null,
    remindDaysBefore: [0],
    nextOccurrence: null,
    createdAt: "",
    updatedAt: "",
  };
}

const today = { year: 2026, month: 10, day: 6 };

describe("UpcomingList", () => {
  it("hiện đếm ngược 'Hôm nay', 'còn N ngày' và số năm", () => {
    const events = [
      makeEvent("1", "Hôm nay nè", 6, 10, null),
      makeEvent("2", "Sinh nhật", 18, 10, 1990),
    ];
    const { items, unresolved } = getUpcomingOccurrences(events, today);
    renderWithProviders(
      <UpcomingList
        items={items}
        unresolved={unresolved}
        categories={new Map()}
        onEdit={vi.fn()}
      />,
    );
    expect(screen.getByText("Hôm nay")).toBeInTheDocument();
    expect(screen.getByText("còn 12 ngày")).toBeInTheDocument();
    expect(screen.getByText("36 năm")).toBeInTheDocument();
  });

  it("chỉ hiện 6 dòng đầu, 'Xem thêm' mở phần còn lại, bấm dòng gọi onEdit", async () => {
    const events = Array.from({ length: 8 }, (_, i) =>
      makeEvent(`e${i}`, `Việc ${i}`, 7 + i, 10, null),
    );
    const { items } = getUpcomingOccurrences(events, today);
    const onEdit = vi.fn();
    renderWithProviders(
      <UpcomingList items={items} unresolved={[]} categories={new Map()} onEdit={onEdit} />,
    );

    expect(screen.queryByText("Việc 7")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Xem thêm" }));
    expect(screen.getByText("Việc 7")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Việc 0/ }));
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: "e0" }));
  });

  it("sự kiện âm lịch chưa quy đổi nằm ở mục riêng", () => {
    const lunar: EventItem = { ...makeEvent("l", "Rằm", 15, 8, null), calendarType: "lunar" };
    const { items, unresolved } = getUpcomingOccurrences([lunar], today);
    renderWithProviders(
      <UpcomingList
        items={items}
        unresolved={unresolved}
        categories={new Map()}
        onEdit={vi.fn()}
      />,
    );
    expect(screen.getByText("Âm lịch, chưa có ngày dương")).toBeInTheDocument();
    expect(screen.getByText("15/8 âm lịch")).toBeInTheDocument();
  });
});
