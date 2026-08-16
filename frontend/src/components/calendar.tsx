"use client";

import { useState, useSyncExternalStore } from "react";
import {
  WEEKDAY_LABELS,
  addMonths,
  buildMonthWeeks,
  formatYearMonth,
  isSameDay,
  toDateKey,
  toYearMonth,
  type YearMonth,
} from "@/lib/calendar";

const navButtonClass =
  "flex h-9 items-center justify-center rounded-md border border-zinc-200 px-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:focus-visible:outline-zinc-100";

// ハイドレーションが済んだかだけを見る。値は変わらないので購読は何もしない。
const subscribeNothing = () => () => {};

export function Calendar() {
  // 「今日」はブラウザのタイムゾーンで決まるので、サーバー側の描画結果と
  // ズレうる（このページは静的生成されるのでビルド時の日付で焼かれる）。
  // ハイドレーションが終わるまでは骨組みだけ出し、日付には触れない。
  const isHydrated = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );

  const [today] = useState(() => new Date());
  // null は「まだ月を動かしていない」= 今月を表示、の意味。
  const [selectedMonth, setSelectedMonth] = useState<YearMonth | null>(null);
  const viewMonth = selectedMonth ?? toYearMonth(today);

  if (!isHydrated) {
    return (
      <div
        className="min-h-[34rem] w-full rounded-xl border border-zinc-200 dark:border-zinc-800"
        aria-busy="true"
        aria-label="カレンダーを読み込んでいます"
      />
    );
  }

  const weeks = buildMonthWeeks(viewMonth);
  const isViewingCurrentMonth =
    viewMonth.year === today.getFullYear() &&
    viewMonth.month === today.getMonth();

  return (
    <section className="w-full overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <header className="flex items-center justify-between gap-4 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800 sm:px-6 sm:py-4">
        <h1
          className="text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-50 sm:text-xl"
          aria-live="polite"
        >
          {formatYearMonth(viewMonth)}
        </h1>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className={navButtonClass}
            onClick={() => setSelectedMonth(addMonths(viewMonth, -1))}
            aria-label="前の月"
          >
            ←
          </button>
          <button
            type="button"
            className={navButtonClass}
            onClick={() => setSelectedMonth(toYearMonth(today))}
            disabled={isViewingCurrentMonth}
            aria-label="今月に戻る"
          >
            今日
          </button>
          <button
            type="button"
            className={navButtonClass}
            onClick={() => setSelectedMonth(addMonths(viewMonth, 1))}
            aria-label="次の月"
          >
            →
          </button>
        </div>
      </header>

      <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-zinc-800">
        {WEEKDAY_LABELS.map((label, weekday) => (
          <div
            key={label}
            className={`py-2 text-center text-xs font-medium ${weekdayTextClass(weekday, true)}`}
          >
            {label}
          </div>
        ))}
      </div>

      {/* 罫線は各セルの上/左ボーダーで引き、外周は親の border に任せる */}
      <div className="grid grid-cols-7">
        {weeks.map((week, weekIndex) =>
          week.map(({ date, isCurrentMonth }, weekday) => (
            <div
              key={toDateKey(date)}
              className={`min-h-20 border-zinc-200 p-1.5 dark:border-zinc-800 sm:min-h-24 sm:p-2 ${
                weekIndex > 0 ? "border-t" : ""
              } ${weekday > 0 ? "border-l" : ""} ${
                isCurrentMonth ? "" : "bg-zinc-50/70 dark:bg-zinc-900/40"
              }`}
            >
              <time
                dateTime={toDateKey(date)}
                className={`flex h-6 w-6 items-center justify-center rounded-full text-sm tabular-nums ${
                  isSameDay(date, today)
                    ? "bg-zinc-900 font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : weekdayTextClass(weekday, isCurrentMonth)
                }`}
              >
                {date.getDate()}
              </time>
            </div>
          )),
        )}
      </div>
    </section>
  );
}

/** 日曜は赤、土曜は青。前後の月の日は薄くする。 */
function weekdayTextClass(weekday: number, isCurrentMonth: boolean): string {
  if (!isCurrentMonth) return "text-zinc-400 dark:text-zinc-600";
  if (weekday === 0) return "text-red-600 dark:text-red-400";
  if (weekday === 6) return "text-blue-600 dark:text-blue-400";
  return "text-zinc-800 dark:text-zinc-200";
}
