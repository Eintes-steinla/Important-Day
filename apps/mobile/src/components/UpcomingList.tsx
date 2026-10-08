import { useState } from "react";
import { Pressable, View } from "react-native";
import { useTranslation } from "react-i18next";
import {
  formatPlainDate,
  getCountdownLabel,
  resolveEventAppearance,
  type Category,
  type EventItem,
  type UpcomingOccurrence,
} from "@important-dates/core";
import { Button } from "./Button";
import { EventLeaf } from "./EventLeaf";
import { eventSubtitle, lunarSubtitle } from "./EventRow";
import { Text } from "./Text";
import { useAppearance } from "../providers/AppearanceProvider";

const INITIAL_COUNT = 6;
/** Trong số ngày này thì đếm ngược được tô màu nhấn để dễ thấy. */
const SOON_DAYS = 7;

export function UpcomingList({
  items,
  unresolved,
  categories,
  onEdit,
}: {
  items: UpcomingOccurrence<EventItem>[];
  unresolved: EventItem[];
  categories: Map<string, Category>;
  onEdit: (event: EventItem) => void;
}) {
  const { t } = useTranslation();
  const { language } = useAppearance();
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, INITIAL_COUNT);

  return (
    <View>
      {visible.map(({ event, date, daysUntil, years }) => {
        const category = event.categoryId ? categories.get(event.categoryId) : undefined;
        const { colorKey } = resolveEventAppearance(event, category);
        const subtitle = eventSubtitle(event, category, years, t);
        const countdown = getCountdownLabel(daysUntil, t);
        return (
          <Pressable
            key={event.id}
            accessibilityRole="button"
            accessibilityLabel={`${event.title}, ${formatPlainDate(date, language)}, ${countdown}`}
            onPress={() => onEdit(event)}
            className="min-h-16 flex-row items-center gap-4 border-b border-border py-3 active:opacity-70"
          >
            <EventLeaf day={date.day} month={date.month} colorKey={colorKey} />
            <View className="flex-1">
              <Text weight="medium" numberOfLines={1}>
                {event.title}
              </Text>
              {subtitle ? (
                <Text numberOfLines={1} className="text-sm text-muted">
                  {subtitle}
                </Text>
              ) : null}
            </View>
            <Text
              weight="semibold"
              className={`text-sm ${daysUntil <= SOON_DAYS ? "text-accent" : "text-muted"}`}
            >
              {countdown}
            </Text>
          </Pressable>
        );
      })}

      {items.length > INITIAL_COUNT ? (
        <Button
          variant="ghost"
          label={expanded ? t("events.showLess") : t("events.showMore")}
          accessibilityState={{ expanded }}
          className="mt-2 self-start"
          onPress={() => setExpanded((value) => !value)}
        />
      ) : null}

      {unresolved.length > 0 ? (
        <View className="mt-6 border-t border-border pt-4">
          <Text accessibilityRole="header" weight="displaySemibold" className="text-base">
            {t("events.lunarPendingTitle")}
          </Text>
          <Text className="mt-1 text-sm text-muted">{t("events.lunarPendingHint")}</Text>
          {unresolved.map((event) => (
            <Pressable
              key={event.id}
              accessibilityRole="button"
              onPress={() => onEdit(event)}
              className="min-h-12 flex-row items-center justify-between gap-3 border-b border-border py-2"
            >
              <Text weight="medium" numberOfLines={1} className="flex-1">
                {event.title}
              </Text>
              <Text className="text-sm text-muted">{lunarSubtitle(event, t)}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
