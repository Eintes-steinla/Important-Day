import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  formatPlainDate,
  type Category,
  type DatedOccurrence,
  type EventItem,
  type PlainDate,
} from "@important-dates/core";
import { useAppearance } from "../providers/AppearanceProvider";
import { Button } from "./Button";
import { EventBadge, eventSubtitle } from "./EventRow";

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
  const { language } = useAppearance();
  return (
    <section aria-labelledby="day-panel-title" className="mt-6 border-t border-border pt-5">
      <div className="flex items-center justify-between gap-3">
        <h3 id="day-panel-title" className="font-display text-lg font-semibold">
          {formatPlainDate(date, language, { weekday: "long", day: "numeric", month: "long" })}
        </h3>
        <Button
          variant="subtle"
          className="min-h-9 shrink-0 px-3"
          aria-label={t("calendar.addOnDay")}
          onClick={() => onAdd(date)}
        >
          <Plus aria-hidden="true" size={16} />
          {t("events.add")}
        </Button>
      </div>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{t("calendar.dayEmpty")}</p>
      ) : (
        <ul className="mt-3 divide-y divide-border">
          {items.map(({ event, years }) => {
            const category = event.categoryId ? categories.get(event.categoryId) : undefined;
            const subtitle = eventSubtitle(event, category, years, t);
            return (
              <li key={event.id}>
                <button
                  type="button"
                  onClick={() => onEdit(event)}
                  className="flex min-h-14 w-full items-center gap-3 py-2 text-left"
                >
                  <EventBadge event={event} category={category} />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{event.title}</span>
                    {subtitle ? (
                      <span className="block truncate text-sm text-muted">{subtitle}</span>
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
