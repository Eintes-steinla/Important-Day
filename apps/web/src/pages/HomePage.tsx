import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
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
import { EventFormDialog } from "../components/EventFormDialog";
import { MonthCalendar } from "../components/MonthCalendar";
import { EmptyState, ErrorState, LoadingState } from "../components/StateViews";
import { UpcomingList } from "../components/UpcomingList";
import { useCategoriesQuery, useEventsQuery, useProfileQuery } from "../hooks/queries";
import { useToday } from "../hooks/useToday";
import { errorMessage } from "../lib/errors";
import { useSignedInUser } from "../providers/AuthProvider";

interface FormState {
  open: boolean;
  event: EventItem | null;
  date: PlainDate;
}

export function HomePage() {
  const { t } = useTranslation();
  const user = useSignedInUser();
  const profile = useProfileQuery(user.id);
  const events = useEventsQuery();
  const categoriesQuery = useCategoriesQuery();
  const today = useToday(profile.data?.timezone ?? detectTimeZone());

  const [month, setMonth] = useState<YearMonth>({ year: today.year, month: today.month });
  const [selected, setSelected] = useState<PlainDate>(today);
  const [form, setForm] = useState<FormState>({ open: false, event: null, date: today });

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

  const openCreate = (date: PlainDate) => setForm({ open: true, event: null, date });
  const openEdit = (event: EventItem) => setForm({ open: true, event, date: today });
  const closeForm = () => setForm((current) => ({ ...current, open: false }));

  if (events.isPending || categoriesQuery.isPending) return <LoadingState />;
  if (events.isError || categoriesQuery.isError) {
    return (
      <ErrorState
        detail={errorMessage(t, events.error ?? categoriesQuery.error)}
        onRetry={() => {
          void events.refetch();
          void categoriesQuery.refetch();
        }}
      />
    );
  }

  const hasEvents = events.data.length > 0;

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">{t("nav.home")}</h1>
        <Button onClick={() => openCreate(selected)}>
          <Plus aria-hidden="true" size={18} />
          {t("events.add")}
        </Button>
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <section aria-label={t("calendar.title")}>
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
        </section>

        <section aria-labelledby="upcoming-title">
          <h2 id="upcoming-title" className="font-display text-2xl font-semibold">
            {t("events.upcoming")}
          </h2>
          {hasEvents ? (
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
              action={<Button onClick={() => openCreate(today)}>{t("events.add")}</Button>}
            />
          )}
        </section>
      </div>

      <EventFormDialog
        open={form.open}
        event={form.event}
        defaultDate={form.date}
        categories={categoriesQuery.data}
        onClose={closeForm}
      />
    </>
  );
}
