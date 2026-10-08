import { Pressable, View } from "react-native";
import { Plus } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import {
  formatPlainDate,
  type Category,
  type DatedOccurrence,
  type EventItem,
  type PlainDate,
} from "@important-dates/core";
import { Button } from "./Button";
import { EventBadge, eventSubtitle } from "./EventRow";
import { Text } from "./Text";
import { useAppearance } from "../providers/AppearanceProvider";

export function DayPanel({
  date,
  items,
  categories,
  onAdd,
  onEdit,
}: {
  date: PlainDate;
  items: DatedOccurrence<EventItem>[];
  categories: Map<string, Category>;
  onAdd: (date: PlainDate) => void;
  onEdit: (event: EventItem) => void;
}) {
  const { t } = useTranslation();
  const { language, colors } = useAppearance();
  return (
    <View className="mt-6 border-t border-border pt-5">
      <View className="flex-row items-center justify-between gap-3">
        <Text accessibilityRole="header" weight="displaySemibold" className="flex-1 text-lg">
          {formatPlainDate(date, language, { weekday: "long", day: "numeric", month: "long" })}
        </Text>
        <Button
          variant="subtle"
          label={t("events.add")}
          accessibilityLabel={t("calendar.addOnDay")}
          icon={<Plus size={16} color={colors.text} />}
          className="min-h-10 px-3"
          onPress={() => onAdd(date)}
        />
      </View>
      {items.length === 0 ? (
        <Text className="mt-3 text-sm text-muted">{t("calendar.dayEmpty")}</Text>
      ) : (
        <View className="mt-2">
          {items.map(({ event, years }) => {
            const category = event.categoryId ? categories.get(event.categoryId) : undefined;
            const subtitle = eventSubtitle(event, category, years, t);
            return (
              <Pressable
                key={event.id}
                accessibilityRole="button"
                accessibilityLabel={subtitle ? `${event.title}, ${subtitle}` : event.title}
                onPress={() => onEdit(event)}
                className="min-h-14 flex-row items-center gap-3 border-b border-border py-2 active:opacity-70"
              >
                <EventBadge event={event} category={category} />
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
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
