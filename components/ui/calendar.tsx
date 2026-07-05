"use client";

import { DayPicker, getDefaultClassNames, type DayPickerProps } from "react-day-picker";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type CalendarProps = DayPickerProps;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  const defaults = getDefaultClassNames();

  return (
    <DayPicker
      locale={es}
      showOutsideDays={showOutsideDays}
      className={cn("p-1", className)}
      classNames={{
        ...defaults,
        root: cn("w-fit", defaults.root),
        months: cn("relative flex flex-col gap-4", defaults.months),
        month: cn("flex w-full flex-col gap-3", defaults.month),
        month_caption: cn(
          "flex h-10 items-center justify-center px-10 text-base font-bold text-care-foreground",
          defaults.month_caption
        ),
        caption_label: cn("text-base font-bold", defaults.caption_label),
        nav: cn("absolute inset-x-0 top-0 flex items-center justify-between", defaults.nav),
        button_previous: cn(
          "flex h-9 w-9 items-center justify-center rounded-xl border-2 border-care-secondary/60 bg-white text-care-accent-dark transition-colors hover:bg-care-primary",
          defaults.button_previous
        ),
        button_next: cn(
          "flex h-9 w-9 items-center justify-center rounded-xl border-2 border-care-secondary/60 bg-white text-care-accent-dark transition-colors hover:bg-care-primary",
          defaults.button_next
        ),
        weekdays: cn("flex gap-1", defaults.weekdays),
        weekday: cn(
          "w-10 text-center text-xs font-semibold uppercase tracking-wide text-care-muted",
          defaults.weekday
        ),
        weeks: cn("flex flex-col gap-1", defaults.weeks),
        week: cn("flex gap-1", defaults.week),
        day: cn("relative p-0 text-center", defaults.day),
        day_button: cn(
          "flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold text-care-foreground transition-colors hover:bg-care-secondary/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-care-accent/25",
          defaults.day_button
        ),
        selected: cn(
          "[&>button]:bg-care-accent-dark [&>button]:text-white [&>button]:hover:bg-care-accent-darker",
          defaults.selected
        ),
        today: cn("[&>button]:border-2 [&>button]:border-care-accent/60", defaults.today),
        outside: cn("[&>button]:text-care-muted-light [&>button]:opacity-50", defaults.outside),
        disabled: cn("[&>button]:cursor-not-allowed [&>button]:opacity-30", defaults.disabled),
        hidden: cn("invisible", defaults.hidden),
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          ),
      }}
      {...props}
    />
  );
}

export { Calendar };
