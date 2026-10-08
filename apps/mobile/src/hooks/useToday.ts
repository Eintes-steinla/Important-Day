import { useEffect, useState } from "react";
import { comparePlainDates, todayInTimeZone, type PlainDate } from "@important-dates/core";

/** "Hôm nay" theo múi giờ của người dùng; tự cập nhật khi qua nửa đêm. */
export function useToday(timeZone: string): PlainDate {
  const [today, setToday] = useState(() => todayInTimeZone(timeZone));

  useEffect(() => {
    const refresh = () =>
      setToday((current) => {
        const next = todayInTimeZone(timeZone);
        return comparePlainDates(current, next) === 0 ? current : next;
      });
    refresh();
    const timer = setInterval(refresh, 60_000);
    return () => clearInterval(timer);
  }, [timeZone]);

  return today;
}
