import { useState } from "react";
import { Alert, Pressable, Switch, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronDown } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import {
  DEFAULT_REMIND_DAYS_BEFORE,
  detectTimeZone,
  eventInputSchema,
  getCategoryName,
  parseIsoDate,
  type Category,
  type EventItem,
  type PlainDate,
} from "@important-dates/core";
import { Button } from "../components/Button";
import { Chip, FieldGroup, SegmentedControl, TextField, inputClass } from "../components/fields";
import { ColorPicker, IconPicker } from "../components/pickers";
import { ErrorState, LoadingState } from "../components/StateViews";
import { Text } from "../components/Text";
import {
  useCategoriesQuery,
  useDeleteEvent,
  useEventsQuery,
  useProfileQuery,
  useSaveEvent,
} from "../hooks/queries";
import { useToday } from "../hooks/useToday";
import { errorMessage } from "../lib/errors";
import { fieldErrors, toNumber } from "../lib/forms";
import { useAppearance } from "../providers/AppearanceProvider";
import { useSignedInUser } from "../providers/AuthProvider";
import { useToast } from "../providers/ToastProvider";
import { ModalFrame } from "./ModalFrame";

const REMIND_OPTIONS = [0, 1, 3, 7, 14, 30] as const;

export function EventFormScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ id?: string; date?: string }>();
  const user = useSignedInUser();
  const profile = useProfileQuery(user.id);
  const today = useToday(profile.data?.timezone ?? detectTimeZone());
  const events = useEventsQuery();
  const categories = useCategoriesQuery();

  const editing = params.id ? events.data?.find((event) => event.id === params.id) : undefined;
  const title = params.id ? t("events.edit") : t("events.add");

  if (events.isPending || categories.isPending) {
    return (
      <ModalFrame title={title}>
        <LoadingState />
      </ModalFrame>
    );
  }
  if (events.isError || categories.isError) {
    return (
      <ModalFrame title={title}>
        <ErrorState
          detail={errorMessage(t, events.error ?? categories.error)}
          onRetry={() => {
            void events.refetch();
            void categories.refetch();
          }}
        />
      </ModalFrame>
    );
  }

  const date = (params.date ? parseIsoDate(params.date) : null) ?? today;
  return (
    <ModalFrame title={title}>
      <EventForm event={editing ?? null} defaultDate={date} categories={categories.data} />
    </ModalFrame>
  );
}

function EventForm({
  event,
  defaultDate,
  categories,
}: {
  event: EventItem | null;
  defaultDate: PlainDate;
  categories: Category[];
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const toast = useToast();
  const { colors } = useAppearance();
  const save = useSaveEvent();
  const remove = useDeleteEvent();

  const [titleText, setTitleText] = useState(event?.title ?? "");
  const [note, setNote] = useState(event?.note ?? "");
  const [calendarType, setCalendarType] = useState<"solar" | "lunar">(
    event?.calendarType ?? "solar",
  );
  const [day, setDay] = useState(String(event?.day ?? defaultDate.day));
  const [month, setMonth] = useState(String(event?.month ?? defaultDate.month));
  const [year, setYear] = useState(
    event?.year != null ? String(event.year) : String(defaultDate.year),
  );
  const [yearKnown, setYearKnown] = useState(event?.year != null);
  const [isLeapMonth, setIsLeapMonth] = useState(event?.isLeapMonth ?? false);
  const [categoryId, setCategoryId] = useState<string | null>(event?.categoryId ?? null);
  const [color, setColor] = useState<string | null>(event?.color ?? null);
  const [icon, setIcon] = useState<string | null>(event?.icon ?? null);
  const [remind, setRemind] = useState<number[]>(
    event?.remindDaysBefore ?? [...DEFAULT_REMIND_DAYS_BEFORE],
  );
  const [appearanceOpen, setAppearanceOpen] = useState(color !== null || icon !== null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const message = (key: string | undefined) => (key ? t(key) : undefined);

  const toggleRemind = (days: number) =>
    setRemind((current) =>
      current.includes(days) ? current.filter((d) => d !== days) : [...current, days],
    );

  const submit = async () => {
    const parsed = eventInputSchema.safeParse({
      title: titleText,
      note,
      calendarType,
      day: toNumber(day),
      month: toNumber(month),
      year: yearKnown ? toNumber(year) : null,
      isLeapMonth: calendarType === "lunar" && isLeapMonth,
      categoryId: categoryId ?? "",
      color,
      icon,
      remindDaysBefore: remind,
    });
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    try {
      await save.mutateAsync({ id: event?.id ?? null, input: parsed.data });
      toast.show(t(event ? "events.updated" : "events.created"));
      router.back();
    } catch {
      // Lỗi hiển thị bằng save.error bên dưới
    }
  };

  const confirmDelete = () => {
    if (!event) return;
    Alert.alert(t("events.deleteTitle", { title: event.title }), t("events.deleteBody"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("events.delete"),
        style: "destructive",
        onPress: () => {
          remove.mutate(event.id, {
            onSuccess: () => {
              toast.show(t("events.deleted"));
              router.back();
            },
            onError: (error) => toast.show(errorMessage(t, error), "error"),
          });
        },
      },
    ]);
  };

  return (
    <View className="gap-5">
      <TextField
        label={t("events.fields.title")}
        value={titleText}
        onChangeText={setTitleText}
        autoCorrect={false}
        error={message(errors.title)}
      />

      <FieldGroup legend={t("events.fields.calendarType")}>
        <SegmentedControl<"solar" | "lunar">
          value={calendarType}
          options={[
            { value: "solar", label: t("events.fields.solar") },
            { value: "lunar", label: t("events.fields.lunar") },
          ]}
          onChange={setCalendarType}
        />
      </FieldGroup>

      <FieldGroup
        legend={t("events.fields.date")}
        error={message(errors.day ?? errors.month ?? errors.year ?? errors.isLeapMonth)}
      >
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Text className="mb-1 text-xs text-muted">{t("events.fields.day")}</Text>
            <TextInput
              accessibilityLabel={t("events.fields.day")}
              value={day}
              onChangeText={setDay}
              keyboardType="number-pad"
              maxLength={2}
              className={inputClass}
            />
          </View>
          <View className="flex-1">
            <Text className="mb-1 text-xs text-muted">{t("events.fields.month")}</Text>
            <TextInput
              accessibilityLabel={t("events.fields.month")}
              value={month}
              onChangeText={setMonth}
              keyboardType="number-pad"
              maxLength={2}
              className={inputClass}
            />
          </View>
          <View className="flex-1">
            <Text className="mb-1 text-xs text-muted">{t("events.fields.year")}</Text>
            <TextInput
              accessibilityLabel={t("events.fields.year")}
              value={yearKnown ? year : ""}
              onChangeText={setYear}
              editable={yearKnown}
              keyboardType="number-pad"
              maxLength={4}
              className={`${inputClass} ${yearKnown ? "" : "opacity-50"}`}
            />
          </View>
        </View>
        <View className="mt-3 flex-row items-center justify-between">
          <Text className="text-sm">{t("events.fields.yearUnknown")}</Text>
          <Switch
            accessibilityLabel={t("events.fields.yearUnknown")}
            value={!yearKnown}
            onValueChange={(unknown) => setYearKnown(!unknown)}
            trackColor={{ true: colors.primary }}
          />
        </View>
        {calendarType === "lunar" ? (
          <>
            <View className="mt-1 flex-row items-center justify-between">
              <Text className="text-sm">{t("events.fields.leapMonth")}</Text>
              <Switch
                accessibilityLabel={t("events.fields.leapMonth")}
                value={isLeapMonth}
                onValueChange={setIsLeapMonth}
                trackColor={{ true: colors.primary }}
              />
            </View>
            <Text className="mt-1 text-xs text-muted">{t("events.fields.lunarHint")}</Text>
          </>
        ) : null}
      </FieldGroup>

      <FieldGroup legend={t("events.fields.category")}>
        <View className="flex-row flex-wrap gap-2">
          <Chip
            role="radio"
            label={t("events.fields.noCategory")}
            selected={categoryId === null}
            onPress={() => setCategoryId(null)}
          />
          {categories.map((category) => (
            <Chip
              key={category.id}
              role="radio"
              label={getCategoryName(category, t)}
              selected={categoryId === category.id}
              onPress={() => setCategoryId(category.id)}
            />
          ))}
        </View>
      </FieldGroup>

      {/* Màu và icon mặc định theo danh mục nên gập lại cho form ngắn gọn */}
      <View>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: appearanceOpen }}
          onPress={() => setAppearanceOpen((open) => !open)}
          className="min-h-11 flex-row items-center gap-1"
        >
          <Text weight="medium" className="text-sm">
            {t("events.fields.appearance")}
          </Text>
          <ChevronDown
            size={18}
            color={colors.textMuted}
            style={{ transform: [{ rotate: appearanceOpen ? "180deg" : "0deg" }] }}
          />
        </Pressable>
        {appearanceOpen ? (
          <View className="gap-5 pt-2">
            <FieldGroup legend={t("events.fields.color")}>
              <ColorPicker allowInherit value={color} onChange={setColor} />
            </FieldGroup>
            <FieldGroup legend={t("events.fields.icon")}>
              <IconPicker allowInherit value={icon} onChange={setIcon} />
            </FieldGroup>
          </View>
        ) : null}
      </View>

      <FieldGroup legend={t("events.fields.remind")} error={message(errors.remindDaysBefore)}>
        <View className="flex-row flex-wrap gap-2">
          {REMIND_OPTIONS.map((days) => (
            <Chip
              key={days}
              label={
                days === 0
                  ? t("events.fields.remindOnDay")
                  : t("events.fields.remindDays", { count: days })
              }
              selected={remind.includes(days)}
              onPress={() => toggleRemind(days)}
            />
          ))}
        </View>
        <Text className="mt-2 text-xs text-muted">{t("events.fields.remindHint")}</Text>
      </FieldGroup>

      <TextField
        label={t("events.fields.note")}
        value={note}
        onChangeText={setNote}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        className="min-h-24"
        error={message(errors.note)}
      />

      {save.error ? (
        <Text accessibilityRole="alert" className="text-sm text-danger">
          {errorMessage(t, save.error)}
        </Text>
      ) : null}

      <View className="gap-3 pt-1">
        <Button
          label={save.isPending ? t("common.saving") : t("common.save")}
          loading={save.isPending}
          onPress={() => void submit()}
        />
        {event ? (
          <Button
            variant="ghost"
            label={t("common.delete")}
            loading={remove.isPending}
            onPress={confirmDelete}
          />
        ) : null}
      </View>
    </View>
  );
}
