import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  addMonths,
  formatMonthYear,
  formatPlainDate,
  getEventColor,
  getMonthGrid,
  getWeekdayLabels,
  isSamePlainDate,
  toIsoDate,
  type DatedOccurrence,
  type EventItem,
  type PlainDate,
  type YearMonth,
} from "@important-dates/core";
import { cn } from "../lib/cn";
import { useAppearance } from "../providers/AppearanceProvider";
import { Button } from "./Button";

const MAX_DOTS = 3;

export interface MonthCalendarProps {
  month: YearMonth;
  today: PlainDate;
  selected: PlainDate;
  /** Sự kiện theo ngày (khóa YYYY-MM-DD) cho cả các ô tuần đầu/cuối thuộc tháng khác. */
  occurrences: Map<string, DatedOccurrence<EventItem>[]>;
  /** Màu của từng sự kiện (đã tính theo sự kiện/danh mục), khóa là id sự kiện. */
  colorKeyOf: (event: EventItem) => string;
  onMonthChange: (month: YearMonth) => void;
  onSelect: (date: PlainDate) => void;
}

export function MonthCalendar({
  month,
  today,
  selected,
  occurrences,
  colorKeyOf,
  onMonthChange,
  onSelect,
}: MonthCalendarProps) {
  const { t } = useTranslation();
  const { language, resolvedTheme } = useAppearance();
  const grid = useMemo(() => getMonthGrid(month.year, month.month, 1), [month.year, month.month]);
  const weekdays = getWeekdayLabels(language, 1, "short");
  const isCurrentMonth = today.year === month.year && today.month === month.month;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2
          className="font-display text-2xl font-semibold first-letter:uppercase"
          aria-live="polite"
        >
          {formatMonthYear(month.year, month.month, language)}
        </h2>
        <div className="flex items-center gap-1">
          {!isCurrentMonth ? (
            <Button
              variant="ghost"
              className="min-h-9 px-3"
              onClick={() => {
                onMonthChange({ year: today.year, month: today.month });
                onSelect(today);
              }}
            >
              {t("calendar.goToToday")}
            </Button>
          ) : null}
          <Button
            variant="ghost"
            className="size-11 px-0 text-foreground"
            aria-label={t("calendar.prevMonth")}
            onClick={() => onMonthChange(addMonths(month, -1))}
          >
            <ChevronLeft aria-hidden="true" size={22} />
          </Button>
          <Button
            variant="ghost"
            className="size-11 px-0 text-foreground"
            aria-label={t("calendar.nextMonth")}
            onClick={() => onMonthChange(addMonths(month, 1))}
          >
            <ChevronRight aria-hidden="true" size={22} />
          </Button>
        </div>
      </div>

      <div role="grid" aria-label={t("calendar.title")}>
        <div
          role="row"
          className="grid grid-cols-7 pb-1 text-center text-xs font-medium text-muted"
        >
          {weekdays.map((label) => (
            <span key={label} role="columnheader" className="py-1">
              {label}
            </span>
          ))}
        </div>
        {grid.map((week) => (
          <div key={toIsoDate(week[0] ?? today)} role="row" className="grid grid-cols-7">
            {week.map((date) => {
              const key = toIsoDate(date);
              const items = occurrences.get(key) ?? [];
              const inMonth = date.month === month.month;
              const isToday = isSamePlainDate(date, today);
              const isSelected = isSamePlainDate(date, selected);
              const label = t("calendar.dayLabel", {
                date: formatPlainDate(date, language),
                count: items.length,
              });
              return (
                <div key={key} role="gridcell" aria-selected={isSelected}>
                  <button
                    type="button"
                    aria-label={label}
                    aria-current={isToday ? "date" : undefined}
                    onClick={() => onSelect(date)}
                    className={cn(
                      "flex h-14 w-full flex-col items-center justify-start gap-1 rounded-lg pt-1.5 transition-colors sm:h-16",
                      isSelected ? "bg-surface-muted" : "hover:bg-surface-muted/60",
                      !inMonth && "opacity-40",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-7 items-center justify-center rounded-full text-sm font-medium",
                        isToday && "bg-accent font-semibold text-background",
                      )}
                    >
                      {date.day}
                    </span>
                    <span className="flex h-2 items-center gap-0.5" aria-hidden="true">
                      {items.slice(0, MAX_DOTS).map((item) => (
                        <span
                          key={item.event.id}
                          className="size-1.5 rounded-full"
                          style={{
                            backgroundColor: getEventColor(colorKeyOf(item.event), resolvedTheme)
                              .fg,
                          }}
                        />
                      ))}
                      {items.length > MAX_DOTS ? (
                        <span className="text-[9px] font-semibold leading-none text-muted">
                          {t("calendar.moreEvents", { count: items.length - MAX_DOTS })}
                        </span>
                      ) : null}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
