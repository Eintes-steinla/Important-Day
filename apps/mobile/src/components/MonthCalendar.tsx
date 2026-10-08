import { useMemo } from "react";
import { Pressable, View } from "react-native";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
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
import { Button } from "./Button";
import { Text } from "./Text";
import { useAppearance } from "../providers/AppearanceProvider";

const MAX_DOTS = 3;

export interface MonthCalendarProps {
  month: YearMonth;
  today: PlainDate;
  selected: PlainDate;
  /** Sự kiện theo ngày (khóa YYYY-MM-DD), gồm cả các ô tuần đầu/cuối thuộc tháng khác. */
  occurrences: Map<string, DatedOccurrence<EventItem>[]>;
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
  const { language, resolvedTheme, colors } = useAppearance();
  const grid = useMemo(() => getMonthGrid(month.year, month.month, 1), [month.year, month.month]);
  const weekdays = getWeekdayLabels(language, 1, "short");
  const isCurrentMonth = today.year === month.year && today.month === month.month;
  const title = formatMonthYear(month.year, month.month, language);

  return (
    <View>
      <View className="mb-3 flex-row items-center justify-between">
        <Text accessibilityRole="header" weight="displaySemibold" className="flex-1 text-2xl">
          {title.charAt(0).toUpperCase() + title.slice(1)}
        </Text>
        <View className="flex-row items-center">
          {!isCurrentMonth ? (
            <Button
              variant="ghost"
              label={t("calendar.goToToday")}
              className="min-h-10 px-3"
              onPress={() => {
                onMonthChange({ year: today.year, month: today.month });
                onSelect(today);
              }}
            />
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("calendar.prevMonth")}
            onPress={() => onMonthChange(addMonths(month, -1))}
            className="size-11 items-center justify-center rounded-lg active:bg-surface-muted"
          >
            <ChevronLeft size={22} color={colors.text} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("calendar.nextMonth")}
            onPress={() => onMonthChange(addMonths(month, 1))}
            className="size-11 items-center justify-center rounded-lg active:bg-surface-muted"
          >
            <ChevronRight size={22} color={colors.text} />
          </Pressable>
        </View>
      </View>

      <View className="flex-row pb-1">
        {weekdays.map((label) => (
          <View key={label} className="flex-1 items-center py-1">
            <Text weight="medium" className="text-xs text-muted">
              {label}
            </Text>
          </View>
        ))}
      </View>

      {grid.map((week) => (
        <View key={toIsoDate(week[0] ?? today)} className="flex-row">
          {week.map((date) => {
            const key = toIsoDate(date);
            const items = occurrences.get(key) ?? [];
            const inMonth = date.month === month.month;
            const isToday = isSamePlainDate(date, today);
            const isSelected = isSamePlainDate(date, selected);
            return (
              <Pressable
                key={key}
                accessibilityRole="button"
                accessibilityLabel={t("calendar.dayLabel", {
                  date: formatPlainDate(date, language),
                  count: items.length,
                })}
                accessibilityState={{ selected: isSelected }}
                onPress={() => onSelect(date)}
                className={`h-14 flex-1 items-center rounded-lg pt-1.5 ${isSelected ? "bg-surface-muted" : ""} ${inMonth ? "" : "opacity-40"}`}
              >
                <View
                  className={`size-7 items-center justify-center rounded-full ${isToday ? "bg-accent" : ""}`}
                >
                  <Text
                    weight={isToday ? "semibold" : "medium"}
                    className={`text-sm ${isToday ? "text-background" : ""}`}
                  >
                    {date.day}
                  </Text>
                </View>
                <View className="mt-1 h-2 flex-row items-center gap-0.5">
                  {items.slice(0, MAX_DOTS).map((item) => (
                    <View
                      key={item.event.id}
                      className="size-1.5 rounded-full"
                      style={{
                        backgroundColor: getEventColor(colorKeyOf(item.event), resolvedTheme).fg,
                      }}
                    />
                  ))}
                  {items.length > MAX_DOTS ? (
                    <Text weight="semibold" className="text-[9px] leading-[10px] text-muted">
                      {t("calendar.moreEvents", { count: items.length - MAX_DOTS })}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
