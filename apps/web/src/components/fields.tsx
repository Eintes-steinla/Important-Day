import { useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "../lib/cn";

export const inputClass =
  "min-h-11 w-full rounded-lg border border-border bg-surface px-3 text-base text-foreground placeholder:text-muted sm:text-sm";

/** Ô nhập kèm nhãn và thông báo lỗi; lỗi gắn vào ô bằng aria-describedby. */
export function TextField({
  label,
  error,
  hint,
  className,
  ref,
  ...props
}: ComponentProps<"input"> & { label: string; error?: string | undefined; hint?: string }) {
  const id = useId();
  const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        ref={ref}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={cn(inputClass, error && "border-danger")}
        {...props}
      />
      {hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function FieldGroup({
  legend,
  children,
  error,
  className,
}: {
  legend: string;
  children: ReactNode;
  error?: string | undefined;
  className?: string;
}) {
  return (
    <fieldset className={className}>
      <legend className="mb-1.5 text-sm font-medium">{legend}</legend>
      {children}
      {error ? <p className="mt-1.5 text-sm text-danger">{error}</p> : null}
    </fieldset>
  );
}

/** Nhóm nút chọn một giá trị (radio ẩn, nhãn là nút). */
export function SegmentedRadio<T extends string>({
  name,
  value,
  options,
  onChange,
}: {
  name: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="inline-flex rounded-lg bg-surface-muted p-1">
      {options.map((option) => (
        <label
          key={option.value}
          className={cn(
            "flex min-h-9 cursor-pointer items-center rounded-md px-3 text-sm font-medium transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary",
            value === option.value ? "bg-surface text-foreground shadow-sm" : "text-muted",
          )}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="sr-only"
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}
