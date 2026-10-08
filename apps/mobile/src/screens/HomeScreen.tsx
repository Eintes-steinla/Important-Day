import { useMemo, useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import {
  detectTimeZone,
  getMonthGrid,
  getUpcomingOccurrences,
  groupOccurrencesByDate,
  resolveEventAppearance,
  toIsoDate,
  type Category,
  type EventItem,
  type PlainDate,
  type YearMonth,
} from "@important-dates/core";
import { Button } from "../components/Button";
import { DayPanel } from "../components/DayPanel";
import { MonthCalendar } from "../components/MonthCalendar";
import { Screen } from "../components/Screen";
import { EmptyState, ErrorState, LoadingState } from "../components/StateViews";
import { Text } from "../components/Text";
import { UpcomingList } from "../components/UpcomingList";
import { useCategoriesQuery, useEventsQuery, useProfileQuery } from "../hooks/queries";
import { useToday } from "../hooks/useToday";
import { errorMessage } from "../lib/errors";
import { useAppearance } from "../providers/AppearanceProvider";
import { useSignedInUser } from "../providers/AuthProvider";

export function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useAppearance();
  const user = useSignedInUser();
  const profile = useProfileQuery(user.id);
  const events = useEventsQuery();
  const categoriesQuery = useCategoriesQuery();
  const today = useToday(profile.data?.timezone ?? detectTimeZone());

  const [month, setMonth] = useState<YearMonth>({ year: today.year, month: today.month });
  const [selected, setSelected] = useState<PlainDate>(today);

  const categories = useMemo(
    () => new Map<string, Category>((categoriesQuery.data ?? []).map((c) => [c.id, c])),
    [categoriesQuery.data],
  );

  const eventList = events.data;
  const grid = useMemo(() => getMonthGrid(month.year, month.month, 1), [month.year, month.month]);
  const occurrences = useMemo(() => {
    const first = grid[0]?.[0];
    const lastWeek = grid[grid.length - 1];
    const last = lastWeek?.[lastWeek.length - 1];
    if (!eventList || !first || !last) return new Map();
    return groupOccurrencesByDate(eventList, first, last);
  }, [eventList, grid]);
  const upcoming = useMemo(
    () => (eventList ? getUpcomingOccurrences(eventList, today) : { items: [], unresolved: [] }),
    [eventList, today],
  );

  const colorKeyOf = (event: EventItem) =>
    resolveEventAppearance(event, event.categoryId ? categories.get(event.categoryId) : undefined)
      .colorKey;

  const openCreate = (date: PlainDate) =>
    router.push({ pathname: "/event-form", params: { date: toIsoDate(date) } });
  const openEdit = (event: EventItem) =>
    router.push({ pathname: "/event-form", params: { id: event.id } });

  const addButton = (
    <Button
      label={t("events.add")}
      icon={<Plus size={18} color={colors.primaryForeground} />}
      onPress={() => openCreate(selected)}
    />
  );

  let body;
  if (events.isPending || categoriesQuery.isPending) {
    body = <LoadingState />;
  } else if (events.isError || categoriesQuery.isError) {
    body = (
      <ErrorState
        detail={errorMessage(t, events.error ?? categoriesQuery.error)}
        onRetry={() => {
          void events.refetch();
          void categoriesQuery.refetch();
        }}
      />
    );
  } else {
    body = (
      <View>
        <MonthCalendar
          month={month}
          today={today}
          selected={selected}
          occurrences={occurrences}
          colorKeyOf={colorKeyOf}
          onMonthChange={setMonth}
          onSelect={(date) => {
            setSelected(date);
            // Chọn ô thuộc tháng khác thì chuyển sang tháng đó
            if (date.month !== month.month || date.year !== month.year) {
              setMonth({ year: date.year, month: date.month });
            }
          }}
        />
        <DayPanel
          date={selected}
          items={occurrences.get(toIsoDate(selected)) ?? []}
          categories={categories}
          onAdd={openCreate}
          onEdit={openEdit}
        />
        <View className="mt-10">
          <Text accessibilityRole="header" weight="displaySemibold" className="text-2xl">
            {t("events.upcoming")}
          </Text>
          {events.data.length > 0 ? (
            <UpcomingList
              items={upcoming.items}
              unresolved={upcoming.unresolved}
              categories={categories}
              onEdit={openEdit}
            />
          ) : (
            <EmptyState
              title={t("events.emptyTitle")}
              hint={t("events.emptyHint")}
              action={<Button label={t("events.add")} onPress={() => openCreate(today)} />}
            />
          )}
        </View>
      </View>
    );
  }

  return (
    <Screen title={t("nav.home")} action={addButton}>
      {body}
    </Screen>
  );
}
