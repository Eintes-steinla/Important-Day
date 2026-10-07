import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { DatedOccurrence, EventItem } from "@important-dates/core";
import { MonthCalendar } from "./MonthCalendar";
import { renderWithProviders } from "../test/render";

const event: EventItem = {
  id: "e1",
  categoryId: null,
  title: "Sinh nhật",
  note: null,
  calendarType: "solar",
  day: 12,
  month: 10,
  year: 1990,
  isLeapMonth: false,
  color: "rose",
  icon: null,
  remindDaysBefore: [0],
  nextOccurrence: null,
  createdAt: "",
  updatedAt: "",
};

function setup() {
  const onSelect = vi.fn();
  const onMonthChange = vi.fn();
  const occurrences = new Map<string, DatedOccurrence<EventItem>[]>([
    ["2026-10-12", [{ event, date: { year: 2026, month: 10, day: 12 }, years: 36 }]],
  ]);
  renderWithProviders(
    <MonthCalendar
      month={{ year: 2026, month: 10 }}
      today={{ year: 2026, month: 10, day: 6 }}
      selected={{ year: 2026, month: 10, day: 6 }}
      occurrences={occurrences}
      colorKeyOf={() => "rose"}
      onMonthChange={onMonthChange}
      onSelect={onSelect}
    />,
  );
  return { onSelect, onMonthChange };
}

describe("MonthCalendar", () => {
  it("hiện tiêu đề tháng, đánh dấu hôm nay và nêu số sự kiện trong nhãn ô", () => {
    setup();
    expect(screen.getByRole("heading", { name: /tháng 10 năm 2026/i })).toBeInTheDocument();
    const today = screen.getByRole("button", { current: "date" });
    expect(today).toHaveTextContent("6");
    expect(screen.getByRole("button", { name: /12 tháng 10.*1 sự kiện/ })).toBeInTheDocument();
  });

  it("chọn ngày và đổi tháng gọi đúng callback", async () => {
    const { onSelect, onMonthChange } = setup();
    await userEvent.click(screen.getByRole("button", { name: /12 tháng 10/ }));
    expect(onSelect).toHaveBeenCalledWith({ year: 2026, month: 10, day: 12 });

    await userEvent.click(screen.getByRole("button", { name: "Tháng sau" }));
    expect(onMonthChange).toHaveBeenCalledWith({ year: 2026, month: 11 });
    await userEvent.click(screen.getByRole("button", { name: "Tháng trước" }));
    expect(onMonthChange).toHaveBeenCalledWith({ year: 2026, month: 9 });
  });

  it("tháng khác hiện nút về hôm nay", async () => {
    const onSelect = vi.fn();
    const onMonthChange = vi.fn();
    renderWithProviders(
      <MonthCalendar
        month={{ year: 2027, month: 1 }}
        today={{ year: 2026, month: 10, day: 6 }}
        selected={{ year: 2027, month: 1, day: 1 }}
        occurrences={new Map()}
        colorKeyOf={() => "indigo"}
        onMonthChange={onMonthChange}
        onSelect={onSelect}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Hôm nay" }));
    expect(onMonthChange).toHaveBeenCalledWith({ year: 2026, month: 10 });
    expect(onSelect).toHaveBeenCalledWith({ year: 2026, month: 10, day: 6 });
  });
});
