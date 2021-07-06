import * as React from "react";

export interface TemporalConfig {
  locale: string;
  defaultValue?: TemporalValue;
  value?: TemporalValue;
  onValueChange?: (value: TemporalValue) => void;
  defaultCalendarMonth: Date;
  monthsVisible: string | number;
  weekStartIndex: string | number;
  type: "single" | "range";
}

export interface Day {
  date: Date;
  isToday: boolean;
  isSelected?: boolean;
  isSelectedRange?: boolean;
  isSelectedRangeStart?: boolean;
  isSelectedRangeEnd?: boolean;
  isPreviewedRange?: boolean;
  isPreviewedRangeStart?: boolean;
  isPreviewedRangeEnd?: boolean;
  isWeekday: boolean;
  isWeekend: boolean;
  isCurrentMonth: boolean;
  isPreviousMonth: boolean;
  isNextMonth: boolean;
  getDateProps: () => DateProps;
}

export interface CalendarProps {
  onMouseLeave?: React.MouseEventHandler<HTMLElement>;
}

export interface DateProps {
  ref: React.RefCallback<HTMLElement>;
  key: string;
  tabIndex: -1 | undefined;
  onClick: React.MouseEventHandler<HTMLElement>;
  onFocus: React.FocusEventHandler<HTMLElement>;
  onKeyDown: React.KeyboardEventHandler<HTMLElement>;
}

export interface InputProps {
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  onKeyUp: React.KeyboardEventHandler<HTMLInputElement>;
  onKeyDown: React.KeyboardEventHandler<HTMLInputElement>;
}

export interface DateRange {
  start?: Date;
  end?: Date;
}

export type DynamicDate = keyof typeof dynamicDates;
export type DynamicDateRange = keyof typeof dynamicDateRanges;

export type TemporalValue =
  | Date
  | DateRange
  | DynamicDate
  | DynamicDateRange
  | undefined;

export function useTemporal(defaultConfig?: Partial<TemporalConfig>) {
  const config: TemporalConfig = React.useMemo(
    () => ({
      locale: defaultConfig?.locale || "default",
      value: defaultConfig?.value,
      defaultValue: defaultConfig?.defaultValue,
      defaultCalendarMonth: defaultConfig?.defaultCalendarMonth || new Date(),
      weekStartIndex: defaultConfig?.weekStartIndex || 0,
      type: defaultConfig?.type || "single",
      onValueChange: defaultConfig?.onValueChange,
      monthsVisible: defaultConfig?.monthsVisible || 1,
    }),
    [
      defaultConfig?.defaultCalendarMonth,
      defaultConfig?.defaultValue,
      defaultConfig?.locale,
      defaultConfig?.monthsVisible,
      defaultConfig?.onValueChange,
      defaultConfig?.type,
      defaultConfig?.value,
      defaultConfig?.weekStartIndex,
    ]
  );

  const isControlled = !!(
    defaultConfig && Object.keys(defaultConfig).includes("value")
  );

  const [calendarMonth, setCalendarMonth] = React.useState<Date>(
    new Date(
      config.defaultCalendarMonth?.getFullYear(),
      config.defaultCalendarMonth?.getMonth()
    )
  );

  const [value, setValue] = React.useState<TemporalValue>(
    isControlled ? config.value : config.defaultValue
  );

  const computedValue = React.useMemo(() => {
    if (isControlled) {
      if (typeof config.value === "string") {
        switch (config.type) {
          case "single": {
            // @ts-expect-error Need to filter out keys
            return dynamicDates[config.value];
          }
          case "range": {
            // @ts-expect-error Need to filter out keys
            return dynamicDateRanges[config.value];
          }
        }
      } else return config.value;
    } else {
      if (typeof value === "string") {
        switch (config.type) {
          case "single": {
            // @ts-expect-error Need to filter out keys
            return dynamicDates[value];
          }
          case "range": {
            // @ts-expect-error Need to filter out keys
            return dynamicDateRanges[value];
          }
        }
      } else return value;
    }
  }, [config.type, config.value, isControlled, value]);

  const [previewedRange, setPreviewedRange] = React.useState<DateRange>();

  const [focusedDate, setFocusedDate] = React.useState<Date | undefined>();

  const focusedDateRef = React.useRef<Date | undefined>();
  focusedDateRef.current = focusedDate;

  /**
   * Refs for the HTML elements of the visible dates.
   * Used to set focus on a date.
   */
  const visibleDateRefs = React.useRef<{ [key: string]: HTMLElement }>({});

  const keysPressed = React.useRef<{ [key: string]: true | undefined }>({});

  /**
   * Used to set the visible calendar month date to the first day of the month
   * to fix issues where getting the previous month from the last day of the
   * month can sometimes return the same month.
   */
  const handleSetCalendarMonth = React.useCallback(
    (date: Date | string | number) => {
      if (!date) return;

      if (typeof date === "number" || typeof date === "string") {
        setCalendarMonth(new Date(calendarMonth.getFullYear(), Number(date)));
      } else {
        const newDate = new Date(date.getFullYear(), date.getMonth());

        setCalendarMonth(newDate);
      }
    },
    [calendarMonth]
  );

  const handleSetPreviewedRange = React.useCallback(
    (date: Date) => {
      if (config.type !== "range") return;
      if (!computedValue) return;
      if (typeof computedValue === "string" || computedValue instanceof Date)
        return;

      if ((computedValue.start && computedValue.end) || !computedValue.start)
        return;

      if (date <= computedValue.start) {
        setPreviewedRange({ start: date, end: computedValue.start });
      } else {
        setPreviewedRange({ start: computedValue.start, end: date });
      }
    },
    [config.type, computedValue]
  );

  const handleSetFocusedDate = React.useCallback(
    (date: Date | undefined) => {
      setFocusedDate(date);

      if (config.type === "range" && date) handleSetPreviewedRange(date);

      if (date && date.getMonth() !== calendarMonth.getMonth()) {
        handleSetCalendarMonth(date);
      }
    },
    [
      calendarMonth,
      config.type,
      handleSetCalendarMonth,
      handleSetPreviewedRange,
    ]
  );

  const handleSetValue = React.useCallback(
    (newValue: TemporalValue) => {
      if (isControlled) {
        if (typeof config.onValueChange === "function")
          config?.onValueChange(newValue);
        else
          console.error(
            "useTemporal: You provided a value, but did not provide an onValueChange handler."
          );
      } else setValue(newValue);
    },
    [config, isControlled]
  );

  const handleValueChange = React.useCallback(
    (newValue: TemporalValue) => {
      switch (config.type) {
        case "single": {
          if (!(newValue instanceof Date)) return;
          handleSetValue(newValue);
          handleSetFocusedDate(newValue);
          break;
        }
        case "range": {
          if (!newValue) return;

          if (newValue && !(newValue instanceof Date)) {
            // Date Range or Dynamic Date Range
            handleSetValue(newValue);
          } else {
            if (
              typeof computedValue === "string" ||
              computedValue instanceof Date
            )
              return;
            if (!computedValue?.start) {
              handleSetValue({
                ...computedValue,
                start: getDateAtStartOfDay(newValue),
              });
            } else if (!computedValue.end) {
              if (newValue <= computedValue.start) {
                handleSetValue({
                  start: getDateAtStartOfDay(newValue),
                  end: getDateAtEndOfDay(computedValue.start),
                });
              }
              if (newValue > computedValue.start) {
                handleSetValue({
                  ...computedValue,
                  end: getDateAtEndOfDay(newValue),
                });
              }
              setPreviewedRange({});
            } else {
              handleSetValue({ start: getDateAtStartOfDay(newValue) });
              setPreviewedRange({});
            }

            handleSetFocusedDate(newValue);
          }
        }
      }
    },
    [config.type, computedValue, handleSetFocusedDate, handleSetValue]
  );

  const setPreviousCalendarMonth = React.useCallback(() => {
    const newDate = new Date(
      new Date(calendarMonth).setMonth(calendarMonth.getMonth() - 1)
    );

    handleSetCalendarMonth(newDate);
    handleSetFocusedDate(undefined);
  }, [calendarMonth, handleSetCalendarMonth, handleSetFocusedDate]);

  const setNextCalendarMonth = React.useCallback(() => {
    const newDate = new Date(
      new Date(calendarMonth).setMonth(calendarMonth.getMonth() + 1)
    );

    handleSetCalendarMonth(newDate);
    handleSetFocusedDate(undefined);
  }, [calendarMonth, handleSetCalendarMonth, handleSetFocusedDate]);

  const setCalendarYear = React.useCallback(
    (year: string | number) => {
      const newDate = new Date(
        new Date(calendarMonth).setFullYear(Number(String(year).substr(0, 4)))
      );

      handleSetCalendarMonth(newDate);
      handleSetFocusedDate(undefined);
    },
    [calendarMonth, handleSetCalendarMonth, handleSetFocusedDate]
  );

  const setPreviousCalendarYear = React.useCallback(() => {
    const newDate = new Date(
      new Date(calendarMonth).setFullYear(calendarMonth.getFullYear() - 1)
    );

    handleSetCalendarMonth(newDate);
    handleSetFocusedDate(undefined);
  }, [calendarMonth, handleSetCalendarMonth, handleSetFocusedDate]);

  const setNextCalendarYear = React.useCallback(() => {
    const newDate = new Date(
      new Date(calendarMonth).setFullYear(calendarMonth.getFullYear() + 1)
    );

    handleSetCalendarMonth(newDate);
    handleSetFocusedDate(undefined);
  }, [calendarMonth, handleSetCalendarMonth, handleSetFocusedDate]);

  const setCalendarToday = React.useCallback(() => {
    const newDate = new Date(new Date());

    handleSetCalendarMonth(newDate);
    handleSetFocusedDate(newDate);
  }, [handleSetCalendarMonth, handleSetFocusedDate]);

  /**
   * Select Dates
   */

  const selectPreviousYear = React.useCallback(() => {
    if (config.type !== "single") return;

    if (!(computedValue instanceof Date)) return;

    handleValueChange(
      new Date(
        new Date(computedValue).setFullYear(computedValue.getFullYear() - 1)
      )
    );

    handleSetFocusedDate(undefined);
  }, [config.type, computedValue, handleSetFocusedDate, handleValueChange]);

  const selectNextYear = React.useCallback(() => {
    if (config.type !== "single") return;

    if (!(computedValue instanceof Date)) return;

    handleValueChange(
      new Date(
        new Date(computedValue).setFullYear(computedValue.getFullYear() + 1)
      )
    );

    handleSetFocusedDate(undefined);
  }, [config.type, computedValue, handleSetFocusedDate, handleValueChange]);

  const selectPreviousMonth = React.useCallback(() => {
    if (config.type !== "single") return;

    if (!(computedValue instanceof Date)) return;

    handleValueChange(
      new Date(new Date(computedValue).setMonth(computedValue.getMonth() - 1))
    );

    handleSetFocusedDate(undefined);
  }, [config.type, computedValue, handleSetFocusedDate, handleValueChange]);

  const selectNextMonth = React.useCallback(() => {
    if (config.type !== "single") return;

    if (!(computedValue instanceof Date)) return;

    handleValueChange(
      new Date(new Date(computedValue).setMonth(computedValue.getMonth() + 1))
    );

    handleSetFocusedDate(undefined);
  }, [config.type, computedValue, handleSetFocusedDate, handleValueChange]);

  const selectPreviousDate = React.useCallback(() => {
    if (config.type !== "single") return;

    if (!(computedValue instanceof Date)) return;

    handleValueChange(
      new Date(new Date(computedValue).setDate(computedValue.getMonth() - 1))
    );

    handleSetFocusedDate(undefined);
  }, [config.type, computedValue, handleSetFocusedDate, handleValueChange]);

  const selectNextDate = React.useCallback(() => {
    if (config.type !== "single") return;

    if (!(computedValue instanceof Date)) return;

    handleValueChange(
      new Date(new Date(computedValue).setDate(computedValue.getMonth() + 1))
    );

    handleSetFocusedDate(undefined);
  }, [config.type, computedValue, handleSetFocusedDate, handleValueChange]);

  /**
   * Select Ranges
   */
  const clearSelectedRange = React.useCallback(() => {
    setValue(undefined);
    setPreviewedRange(undefined);
  }, []);

  const days = React.useMemo(() => {
    const days = [];

    const date = new Date();

    while (date.getDay() !== config.weekStartIndex) {
      date.setDate(date.getDate() + 1);
    }

    for (let i = 0; i < 7; i++) {
      days.push({
        index: i,
        long: date.toLocaleString(config.locale, { weekday: "long" }),
        narrow: date.toLocaleString(config.locale, {
          weekday: "narrow",
        }),
        short: date.toLocaleString(config.locale, { weekday: "short" }),
      });
      date.setDate(date.getDate() + 1);
    }

    return days;
  }, [config.locale, config.weekStartIndex]);

  const months = React.useMemo(() => {
    return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(function (mon) {
      const date = new Date(2000, mon);
      return {
        index: mon,
        short: date.toLocaleString(config.locale, { month: "short" }),
        long: date.toLocaleString(config.locale, { month: "long" }),
        "2-digit": date.toLocaleString(config.locale, {
          month: "2-digit",
        }),
        narrow: date.toLocaleString(config.locale, { month: "narrow" }),
        numeric: date.toLocaleString(config.locale, {
          month: "numeric",
        }),
      };
    });
  }, [config.locale]);

  const getDateProps: (date: Date, currentMonth: number) => DateProps =
    React.useCallback(
      (date: Date, currentMonth) => {
        return {
          ref: (ref) => {
            if (ref) visibleDateRefs.current[date.toDateString()] = ref;
          },
          key: date.toDateString(),
          tabIndex: date.getMonth() === currentMonth ? undefined : -1,
          onClick: () => {
            handleValueChange(date);
          },
          ...(config.type === "range" && {
            onMouseEnter: () => {
              handleSetPreviewedRange(date);
            },
          }),
          onFocus: () => {
            if (focusedDateRef.current?.toDateString() !== date.toDateString())
              setFocusedDate(date);
          },
          onKeyDown: (e) => {
            if (e.key === "ArrowUp")
              handleSetFocusedDate(
                new Date(new Date(date).setDate(date.getDate() - 7))
              );
            if (e.key === "ArrowDown")
              handleSetFocusedDate(
                new Date(new Date(date).setDate(date.getDate() + 7))
              );
            if (e.key === "ArrowLeft")
              handleSetFocusedDate(
                new Date(new Date(date).setDate(date.getDate() - 1))
              );
            if (e.key === "ArrowRight")
              handleSetFocusedDate(
                new Date(new Date(date).setDate(date.getDate() + 1))
              );
          },
        };
      },
      [
        config.type,
        handleSetFocusedDate,
        handleSetPreviewedRange,
        handleValueChange,
      ]
    );

  const getDates = React.useCallback(
    (calendarMonth: Date, monthsVisible: string | number) => {
      const dates: Iterable<Day> = [];

      dates[Symbol.iterator] = function* (): Generator<Day> {
        const startMonthDate = new Date(new Date(calendarMonth).setDate(1));
        const finalMonthDate = new Date(
          new Date(startMonthDate).setMonth(
            startMonthDate.getMonth() + Number(monthsVisible)
          )
        );

        const currentDate = new Date(startMonthDate);

        while (currentDate.getDate() !== 1) {
          currentDate.setDate(currentDate.getDate() - 1);
        }

        while (currentDate.getDay() !== config.weekStartIndex) {
          currentDate.setDate(currentDate.getDate() - 1);
        }

        while (
          currentDate.getTime() < finalMonthDate.getTime() ||
          currentDate.getDay() !== config.weekStartIndex
        ) {
          const yieldDate = new Date(currentDate);

          yield {
            date: yieldDate,
            isToday: yieldDate.toDateString() === new Date().toDateString(),
            ...(config.type === "single" && {
              isSelected:
                yieldDate.toDateString() === computedValue?.toDateString(),
            }),
            ...(config.type === "range" && {
              isSelectedRange:
                !!computedValue?.start &&
                yieldDate >= computedValue.start &&
                !!computedValue.end &&
                yieldDate <= computedValue.end,
              isSelectedRangeStart:
                !!computedValue?.start &&
                yieldDate.toDateString() ===
                  computedValue.start?.toDateString(),
              isSelectedRangeEnd:
                !!computedValue?.end &&
                yieldDate.toDateString() === computedValue.end?.toDateString(),
              isPreviewedRange:
                !!previewedRange?.start &&
                yieldDate >= previewedRange.start &&
                !!previewedRange.end &&
                yieldDate <= previewedRange.end,
              isPreviewedRangeStart:
                yieldDate.toDateString() ===
                previewedRange?.start?.toDateString(),
              isPreviewedRangeEnd:
                yieldDate.toDateString() ===
                previewedRange?.end?.toDateString(),
            }),
            isWeekday: [1, 2, 3, 4, 5].includes(yieldDate.getDay()),
            isWeekend: [0, 6].includes(yieldDate.getDay()),
            isCurrentMonth: yieldDate.getMonth() === startMonthDate.getMonth(),
            isPreviousMonth:
              yieldDate.getMonth() === startMonthDate.getMonth() - 1,
            isNextMonth: yieldDate.getMonth() === startMonthDate.getMonth() + 1,
            getDateProps: () =>
              getDateProps(yieldDate, startMonthDate.getMonth()),
          };

          currentDate.setDate(currentDate.getDate() + 1);
        }
      };

      return Array.from(dates);
    },
    [
      config.type,
      config.weekStartIndex,
      computedValue,
      getDateProps,
      previewedRange?.end,
      previewedRange?.start,
    ]
  );

  const dates = React.useMemo(
    () => getDates(calendarMonth, config.monthsVisible),
    [calendarMonth, config.monthsVisible, getDates]
  );

  const getCalendarProps: () => CalendarProps = React.useCallback(() => {
    return {
      ...(config.type === "range" && {
        onMouseLeave: () => {
          if (config.type === "range") setPreviewedRange({});
        },
      }),
    };
  }, [config.type]);

  const getInputProps: () => InputProps = React.useCallback(() => {
    return {
      value:
        computedValue instanceof Date
          ? computedValue?.toLocaleDateString()
          : "",
      onChange: () => {
        return null;
      },
      onKeyUp: (e) => {
        if (keysPressed.current[e.key] === true)
          delete keysPressed.current[e.key];
      },
      onKeyDown: (e) => {
        keysPressed.current[e.key] = true;

        if (e.key === "ArrowUp" && computedValue) {
          if (keysPressed.current["Shift"] && keysPressed.current["Alt"])
            selectNextYear();
          else if (keysPressed.current["Shift"]) selectNextMonth();
          else selectNextDate();
        }

        if (e.key === "ArrowDown" && computedValue) {
          if (keysPressed.current["Shift"] && keysPressed.current["Alt"])
            selectPreviousYear();
          else if (keysPressed.current["Shift"]) selectPreviousMonth();
          else selectPreviousDate();
        }
      },
    };
  }, [
    computedValue,
    selectNextYear,
    selectNextMonth,
    selectNextDate,
    selectPreviousYear,
    selectPreviousMonth,
    selectPreviousDate,
  ]);

  React.useEffect(() => {
    visibleDateRefs.current = Object.fromEntries(
      Object.entries(visibleDateRefs.current).filter(([, value]) => !!value)
    );
  }, []);

  React.useEffect(() => {
    if (!focusedDate) return;
    visibleDateRefs.current[focusedDate?.toDateString()]?.focus();
  }, [focusedDate]);

  return {
    getInputProps,
    getCalendarProps,
    value,
    days,
    months,
    calendar: {
      month: new Date(calendarMonth).getMonth(),
      year: new Date(calendarMonth).getFullYear(),
      dates,
    },
    methods: {
      setCalendarMonth: handleSetCalendarMonth,
      setPreviousCalendarMonth,
      setNextCalendarMonth,
      setCalendarYear,
      setPreviousCalendarYear,
      setNextCalendarYear,
      setCalendarToday,
      selectPreviousDate,
      selectNextDate,
      clearSelectedRange,
    },
  };
}

export function getOrdinal(number: number) {
  const pluralRules = new Intl.PluralRules("en-US", { type: "ordinal" });

  const ordinals = {
    one: "st",
    two: "nd",
    few: "rd",
    many: "th",
    zero: "th",
    other: "th",
  };

  return `${number}${ordinals[pluralRules.select(number)]}`;
}

function getDateAtStartOfDay(date?: Date) {
  if (!date) return;
  return new Date(new Date(date.setHours(0, 0, 0, 0)));
}

function getDateAtEndOfDay(date?: Date) {
  if (!date) return;
  return new Date(new Date(date.setHours(23, 59, 59, 999)));
}

export const dynamicDates = {
  TODAY: new Date(),
  YESTERDAY: new Date(
    new Date(new Date().setDate(new Date().getDate() - 1)).setHours(0, 0, 0, 0)
  ),
  TOMORROW: new Date(
    new Date(new Date().setDate(new Date().getDate() + 1)).setHours(0, 0, 0, 0)
  ),
};

export const dynamicDateRanges = {
  TODAY: {
    name: "Today",
    start: new Date(new Date().setHours(0, 0, 0, 0)),
    end: new Date(),
  },
  YESTERDAY: {
    name: "Yesterday",
    start: new Date(
      new Date(new Date().setDate(new Date().getDate() - 1)).setHours(
        0,
        0,
        0,
        0
      )
    ),
    end: new Date(
      new Date(new Date().setDate(new Date().getDate() - 1)).setHours(
        23,
        59,
        59,
        999
      )
    ),
  },
  THIS_MONTH: {
    name: "This Month",
    start: new Date(new Date(new Date().setDate(1)).setHours(0, 0, 0, 0)),
    end: new Date(),
  },
  LAST_MONTH: {
    name: "Last Month",
    start: new Date(
      new Date().getFullYear(),
      new Date().getMonth() - 1,
      1,
      0,
      0,
      0,
      0
    ),
    end: new Date(new Date(new Date().setDate(0)).setHours(23, 59, 59, 999)),
  },
  LAST_90_DAYS: {
    name: "Last 90 Days",
    start: new Date(
      new Date(new Date().setDate(new Date().getDate() - 90)).setHours(
        0,
        0,
        0,
        0
      )
    ),
    end: new Date(),
  },
  THIS_YEAR: {
    name: "This Year",
    start: new Date(new Date().getFullYear(), 0, 1, 0, 0, 0, 0),
    end: new Date(),
  },
  LAST_YEAR: {
    name: "Last Year",
    start: new Date(new Date().getFullYear() - 1, 0, 1),
    end: new Date(new Date().getFullYear() - 1, 11, 31, 23, 59, 59, 999),
  },
};
