import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EventFormDialog } from "./EventFormDialog";
import { renderWithProviders } from "../test/render";

const saveEvent = vi.hoisted(() => vi.fn());

// Thay hook dữ liệu bằng bản giả để test form không cần Supabase
vi.mock("../hooks/queries", () => ({
  useSaveEvent: () => ({ mutateAsync: saveEvent, isPending: false, error: null }),
  useDeleteEvent: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

const defaultDate = { year: 2026, month: 10, day: 7 };

function open() {
  renderWithProviders(
    <EventFormDialog
      open
      event={null}
      defaultDate={defaultDate}
      categories={[]}
      onClose={vi.fn()}
    />,
  );
}

describe("EventFormDialog", () => {
  beforeEach(() => saveEvent.mockReset());

  it("để trống tiêu đề thì báo lỗi bằng tiếng Việt và không lưu", async () => {
    open();
    await userEvent.click(screen.getByRole("button", { name: "Lưu" }));
    expect(await screen.findByText("Vui lòng nhập tiêu đề")).toBeInTheDocument();
    expect(saveEvent).not.toHaveBeenCalled();
  });

  it("ngày không tồn tại (31/2) bị chặn", async () => {
    open();
    await userEvent.type(screen.getByLabelText("Tiêu đề"), "Thử");
    const day = screen.getByLabelText("Ngày", { selector: "input" });
    await userEvent.clear(day);
    await userEvent.type(day, "31");
    const month = screen.getByLabelText("Tháng", { selector: "input" });
    await userEvent.clear(month);
    await userEvent.type(month, "2");
    await userEvent.click(screen.getByRole("button", { name: "Lưu" }));
    expect(await screen.findByText("Ngày không tồn tại trong tháng này")).toBeInTheDocument();
    expect(saveEvent).not.toHaveBeenCalled();
  });

  it("gửi dữ liệu đã chuẩn hóa: năm null khi 'Không rõ năm', nhắc trước mặc định", async () => {
    saveEvent.mockResolvedValue(undefined);
    open();
    await userEvent.type(screen.getByLabelText("Tiêu đề"), "  Sinh nhật Lan  ");
    await userEvent.click(screen.getByRole("button", { name: "Lưu" }));
    await waitFor(() => expect(saveEvent).toHaveBeenCalledTimes(1));
    expect(saveEvent.mock.calls[0]?.[0]).toMatchObject({
      id: null,
      input: {
        title: "Sinh nhật Lan",
        day: 7,
        month: 10,
        year: null,
        calendarType: "solar",
        categoryId: null,
        remindDaysBefore: [0],
      },
    });
  });

  it("bỏ chọn 'Không rõ năm' thì nhập được năm và gửi đúng", async () => {
    saveEvent.mockResolvedValue(undefined);
    open();
    await userEvent.type(screen.getByLabelText("Tiêu đề"), "Cưới");
    await userEvent.click(screen.getByLabelText("Không rõ năm"));
    const year = screen.getByLabelText("Năm", { selector: "input" });
    await userEvent.clear(year);
    await userEvent.type(year, "2018");
    await userEvent.click(screen.getByRole("button", { name: "Lưu" }));
    await waitFor(() => expect(saveEvent).toHaveBeenCalled());
    expect(saveEvent.mock.calls[0]?.[0]).toMatchObject({ input: { year: 2018 } });
  });
});
