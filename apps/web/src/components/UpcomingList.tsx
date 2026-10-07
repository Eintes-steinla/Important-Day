import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  formatPlainDate,
  getCountdownLabel,
  resolveEventAppearance,
  type Category,
  type EventItem,
  type UpcomingOccurrence,
} from "@important-dates/core";
import { cn } from "../lib/cn";
import { useAppearance } from "../providers/AppearanceProvider";
import { Button } from "./Button";
import { EventLeaf } from "./EventLeaf";
import { eventSubtitle, lunarSubtitle } from "./EventRow";

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
    <div>
      <ul className="divide-y divide-border">
        {visible.map(({ event, date, daysUntil, years }) => {
          const category = event.categoryId ? categories.get(event.categoryId) : undefined;
          const { colorKey } = resolveEventAppearance(event, category);
          const subtitle = eventSubtitle(event, category, years, t);
          const soon = daysUntil <= SOON_DAYS;
          return (
            <li key={event.id}>
              <button
                type="button"
                onClick={() => onEdit(event)}
                aria-label={`${event.title}, ${formatPlainDate(date, language)}, ${getCountdownLabel(daysUntil, t)}`}
                className="flex min-h-16 w-full items-center gap-4 py-3 text-left"
              >
                <EventLeaf day={date.day} month={date.month} colorKey={colorKey} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{event.title}</span>
                  {subtitle ? (
                    <span className="block truncate text-sm text-muted">{subtitle}</span>
                  ) : null}
                </span>
                <span
                  className={cn(
                    "shrink-0 text-sm font-semibold",
                    soon ? "text-accent" : "text-muted",
                  )}
                >
                  {getCountdownLabel(daysUntil, t)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {items.length > INITIAL_COUNT ? (
        <Button
          variant="ghost"
          className="mt-2"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? t("events.showLess") : t("events.showMore")}
        </Button>
      ) : null}

      {unresolved.length > 0 ? (
        <section className="mt-6 border-t border-border pt-4">
          <h3 className="font-display text-base font-semibold">{t("events.lunarPendingTitle")}</h3>
          <p className="mt-1 text-sm text-muted">{t("events.lunarPendingHint")}</p>
          <ul className="mt-2 divide-y divide-border">
            {unresolved.map((event) => (
              <li key={event.id}>
                <button
                  type="button"
                  onClick={() => onEdit(event)}
                  className="flex min-h-12 w-full items-center justify-between gap-3 py-2 text-left"
                >
                  <span className="truncate font-medium">{event.title}</span>
                  <span className="shrink-0 text-sm text-muted">{lunarSubtitle(event, t)}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
