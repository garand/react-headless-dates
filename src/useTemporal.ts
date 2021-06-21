import * as React from "react";

interface TemporalConfig {
  locale?: string;
  initialDate?: Date;
  weekStartIndex?: string | number;
}

interface Day {
  date: Date;
  isToday: boolean;
  isSelected?: boolean;
  isWeekday: boolean;
  isWeekend: boolean;
  isCurrentMonth: boolean;
  isPreviousMonth: boolean;
  isNextMonth: boolean;
  getDateProps: () => DateProps;
}

interface DateProps {
  ref: React.RefCallback<HTMLElement>;
  key: string;
  tabIndex: -1 | undefined;
  onClick: React.MouseEventHandler<HTMLElement>;
  onFocus: React.FocusEventHandler<HTMLElement>;
  onKeyDown: React.KeyboardEventHandler<HTMLElement>;
}

interface InputProps {
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  onKeyUp: React.KeyboardEventHandler<HTMLInputElement>;
  onKeyDown: React.KeyboardEventHandler<HTMLInputElement>;
}

export function useTemporal(config?: TemporalConfig) {
  const computedConfig = React.useMemo(
    () => ({
      locale: "default",
      initialDate: new Date(),
      weekStartIndex: 0,
      ...config,
    }),
    [config]
  );

  const [calendarMonth, setCalendarMonth] = React.useState<Date>(
    new Date(new Date(computedConfig.initialDate).setDate(1))
  );

  const [selectedDate, setSelectedDate] = React.useState<Date>();

  const [focusedDate, setFocusedDate] = React.useState<Date | undefined>(
    new Date(new Date(computedConfig.initialDate))
  );

  const focusedDateRef = React.useRef<Date | undefined>(focusedDate);

  const dateRefs = React.useRef<{ [key: string]: HTMLElement }>({});

  const keysPressed = React.useRef<{ [key: string]: true | undefined }>({});

  const handleSetCalendarMonth = React.useCallback((date: Date) => {
    if (!date) return;
    const newDate = new Date(new Date(date).setDate(1));

    setCalendarMonth(newDate);
  }, []);

  const handleSetFocusedDate = React.useCallback(
    (date: Date | undefined) => {
      setFocusedDate(date);

      if (date && date.getMonth() !== calendarMonth.getMonth()) {
        handleSetCalendarMonth(date);
      }
    },
    [calendarMonth, handleSetCalendarMonth]
  );

  const handleSetSelectedDate = React.useCallback(
    (date: Date) => {
      const newDate = new Date(date);

      setSelectedDate(newDate);
      handleSetFocusedDate(newDate);
      handleSetCalendarMonth(newDate);
    },
    [handleSetCalendarMonth, handleSetFocusedDate]
  );

  const setMonth = React.useCallback(
    (month: string | number) => {
      const newDate = new Date(new Date(calendarMonth).setMonth(Number(month)));

      handleSetCalendarMonth(newDate);
      handleSetFocusedDate(undefined);
    },
    [calendarMonth, handleSetCalendarMonth, handleSetFocusedDate]
  );

  const setPreviousMonth = React.useCallback(() => {
    const newDate = new Date(
      new Date(calendarMonth).setMonth(calendarMonth.getMonth() - 1)
    );

    handleSetCalendarMonth(newDate);
    handleSetFocusedDate(undefined);
  }, [calendarMonth, handleSetCalendarMonth, handleSetFocusedDate]);

  const setNextMonth = React.useCallback(() => {
    const newDate = new Date(
      new Date(calendarMonth).setMonth(calendarMonth.getMonth() + 1)
    );

    handleSetCalendarMonth(newDate);
    handleSetFocusedDate(undefined);
  }, [calendarMonth, handleSetCalendarMonth, handleSetFocusedDate]);

  const setYear = React.useCallback(
    (year: string | number) => {
      const newDate = new Date(
        new Date(calendarMonth).setFullYear(Number(String(year).substr(0, 4)))
      );

      handleSetCalendarMonth(newDate);
      handleSetFocusedDate(undefined);
    },
    [calendarMonth, handleSetCalendarMonth, handleSetFocusedDate]
  );

  const setPreviousYear = React.useCallback(() => {
    const newDate = new Date(
      new Date(calendarMonth).setFullYear(calendarMonth.getFullYear() - 1)
    );

    handleSetCalendarMonth(newDate);
    handleSetFocusedDate(undefined);
  }, [calendarMonth, handleSetCalendarMonth, handleSetFocusedDate]);

  const setNextYear = React.useCallback(() => {
    const newDate = new Date(
      new Date(calendarMonth).setFullYear(calendarMonth.getFullYear() + 1)
    );

    handleSetCalendarMonth(newDate);
    handleSetFocusedDate(undefined);
  }, [calendarMonth, handleSetCalendarMonth, handleSetFocusedDate]);

  const setToday = React.useCallback(() => {
    const newDate = new Date(new Date());

    handleSetCalendarMonth(newDate);
    handleSetFocusedDate(newDate);
  }, [handleSetCalendarMonth, handleSetFocusedDate]);

  /**
   * Select Dates
   */

  const selectPreviousYear = React.useCallback(() => {
    if (!selectedDate) return;
    const newDate = new Date(
      new Date(selectedDate).setFullYear(selectedDate.getFullYear() - 1)
    );

    handleSetSelectedDate(newDate);
    handleSetFocusedDate(undefined);
  }, [handleSetFocusedDate, handleSetSelectedDate, selectedDate]);

  const selectNextYear = React.useCallback(() => {
    if (!selectedDate) return;
    const newDate = new Date(
      new Date(selectedDate).setFullYear(selectedDate.getFullYear() + 1)
    );

    handleSetSelectedDate(newDate);
    handleSetFocusedDate(undefined);
  }, [handleSetFocusedDate, handleSetSelectedDate, selectedDate]);

  const selectPreviousMonth = React.useCallback(() => {
    if (!selectedDate) return;
    const newDate = new Date(
      new Date(selectedDate).setMonth(selectedDate.getMonth() - 1)
    );

    handleSetSelectedDate(newDate);
    handleSetFocusedDate(undefined);
  }, [handleSetFocusedDate, handleSetSelectedDate, selectedDate]);

  const selectNextMonth = React.useCallback(() => {
    if (!selectedDate) return;
    const newDate = new Date(
      new Date(selectedDate).setMonth(selectedDate.getMonth() + 1)
    );

    handleSetSelectedDate(newDate);
    handleSetFocusedDate(undefined);
  }, [handleSetFocusedDate, handleSetSelectedDate, selectedDate]);

  const selectPreviousDate = React.useCallback(() => {
    if (!selectedDate) return;
    const newDate = new Date(
      new Date(selectedDate).setDate(selectedDate.getDate() - 1)
    );

    handleSetSelectedDate(newDate);
    handleSetFocusedDate(undefined);
  }, [handleSetFocusedDate, handleSetSelectedDate, selectedDate]);

  const selectNextDate = React.useCallback(() => {
    if (!selectedDate) return;
    const newDate = new Date(
      new Date(selectedDate).setDate(selectedDate.getDate() + 1)
    );

    handleSetSelectedDate(newDate);
    handleSetFocusedDate(undefined);
  }, [handleSetFocusedDate, handleSetSelectedDate, selectedDate]);

  const days = React.useMemo(() => {
    const days = [];

    const date = new Date();

    while (date.getDay() !== computedConfig.weekStartIndex) {
      date.setDate(date.getDate() + 1);
    }

    for (let i = 0; i < 7; i++) {
      days.push({
        index: i,
        long: date.toLocaleString(computedConfig.locale, { weekday: "long" }),
        narrow: date.toLocaleString(computedConfig.locale, {
          weekday: "narrow",
        }),
        short: date.toLocaleString(computedConfig.locale, { weekday: "short" }),
      });
      date.setDate(date.getDate() + 1);
    }

    return days;
  }, [computedConfig.locale, computedConfig.weekStartIndex]);

  const months = React.useMemo(() => {
    return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(function (mon) {
      const date = new Date(2000, mon);
      return {
        index: mon,
        short: date.toLocaleString(computedConfig.locale, { month: "short" }),
        long: date.toLocaleString(computedConfig.locale, { month: "long" }),
        "2-digit": date.toLocaleString(computedConfig.locale, {
          month: "2-digit",
        }),
        narrow: date.toLocaleString(computedConfig.locale, { month: "narrow" }),
        numeric: date.toLocaleString(computedConfig.locale, {
          month: "numeric",
        }),
      };
    });
  }, [computedConfig.locale]);

  const getDateProps: (date: Date, currentMonth: number) => DateProps =
    React.useCallback(
      (date: Date, currentMonth) => {
        return {
          ref: (ref) => {
            if (ref) dateRefs.current[date.toDateString()] = ref;
          },
          key: date.toDateString(),
          tabIndex: date.getMonth() === currentMonth ? undefined : -1,
          onClick: () => handleSetSelectedDate(date),
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
      [handleSetFocusedDate, handleSetSelectedDate]
    );

  const getDates = React.useCallback(
    (calendarMonth: Date) => {
      const dates: Iterable<Day> = [];

      dates[Symbol.iterator] = function* (): Generator<Day> {
        const currentMonth = new Date(new Date(calendarMonth).setDate(1));

        const startMonth = new Date(currentMonth).getMonth();
        const previousMonth = new Date(
          new Date(currentMonth).setMonth(startMonth - 1)
        ).getMonth();
        const nextMonth = new Date(
          new Date(currentMonth).setMonth(startMonth + 1)
        ).getMonth();

        const currentDate = new Date(currentMonth);

        while (currentDate.getDate() !== 1) {
          currentDate.setDate(currentDate.getDate() - 1);
        }

        while (currentDate.getDay() !== computedConfig.weekStartIndex) {
          currentDate.setDate(currentDate.getDate() - 1);
        }

        while (
          [previousMonth, startMonth].includes(currentDate.getMonth()) ||
          (currentDate.getMonth() === nextMonth &&
            currentDate.getDay() !== computedConfig.weekStartIndex)
        ) {
          const yieldDate = new Date(currentDate);

          yield {
            date: yieldDate,
            isToday: yieldDate.toDateString() === new Date().toDateString(),
            isSelected:
              yieldDate.toDateString() === selectedDate?.toDateString(),
            isWeekday: [1, 2, 3, 4, 5].includes(yieldDate.getDay()),
            isWeekend: [0, 6].includes(yieldDate.getDay()),
            isCurrentMonth: yieldDate.getMonth() === startMonth,
            isPreviousMonth: yieldDate.getMonth() === startMonth - 1,
            isNextMonth: yieldDate.getMonth() === startMonth + 1,
            getDateProps: () =>
              getDateProps(yieldDate, currentMonth.getMonth()),
          };

          currentDate.setDate(currentDate.getDate() + 1);
        }
      };

      return [...dates];
    },
    [computedConfig.weekStartIndex, getDateProps, selectedDate]
  );

  const dates = React.useMemo(
    () => getDates(calendarMonth),
    [calendarMonth, getDates]
  );

  const getInputProps: () => InputProps = React.useCallback(() => {
    return {
      value: selectedDate?.toLocaleDateString() || "",
      onChange: () => {
        return null;
      },
      onKeyUp: (e) => {
        if (keysPressed.current[e.key] === true)
          delete keysPressed.current[e.key];
      },
      onKeyDown: (e) => {
        keysPressed.current[e.key] = true;

        if (e.key === "ArrowUp" && selectedDate) {
          if (keysPressed.current["Shift"] && keysPressed.current["Alt"])
            selectNextYear();
          else if (keysPressed.current["Shift"]) selectNextMonth();
          else selectNextDate();
        }

        if (e.key === "ArrowDown" && selectedDate) {
          if (keysPressed.current["Shift"] && keysPressed.current["Alt"])
            selectPreviousYear();
          else if (keysPressed.current["Shift"]) selectPreviousMonth();
          else selectPreviousDate();
        }
      },
    };
  }, [
    selectedDate,
    selectPreviousMonth,
    selectPreviousYear,
    selectPreviousDate,
    selectNextMonth,
    selectNextYear,
    selectNextDate,
  ]);

  React.useEffect(() => {
    dateRefs.current = Object.fromEntries(
      Object.entries(dateRefs.current).filter(([, value]) => !!value)
    );
  }, []);

  React.useEffect(() => {
    if (!focusedDate) return;
    dateRefs.current[focusedDate?.toDateString()]?.focus();
  }, [focusedDate]);

  return {
    getInputProps,
    selectedDate,
    days,
    months,
    calendar: {
      month: new Date(calendarMonth).getMonth(),
      year: new Date(calendarMonth).getFullYear(),
      dates,
    },
    methods: {
      setMonth,
      setPreviousMonth,
      setNextMonth,
      setYear,
      setPreviousYear,
      setNextYear,
      setToday,
      selectPreviousDate,
      selectNextDate,
      setSelectedDate: handleSetSelectedDate,
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
